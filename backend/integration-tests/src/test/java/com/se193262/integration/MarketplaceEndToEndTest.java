package com.se193262.integration;

import static org.junit.jupiter.api.Assertions.*;

import com.se193262.bakeryservice.BakeryServiceApplication;
import com.se193262.cakeaiservice.CakeAiServiceApplication;
import com.se193262.identityservice.IdentityServiceApplication;
import com.se193262.marketplaceservice.MarketplaceServiceApplication;
import com.se193262.orderservice.OrderServiceApplication;
import com.se193262.subscriptionservice.SubscriptionServiceApplication;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.RestClient;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;

import tools.jackson.databind.*;

import java.net.ServerSocket;
import java.nio.file.*;
import java.security.*;
import java.sql.*;
import java.time.Instant;
import java.util.*;

@Testcontainers(disabledWithoutDocker = true)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MarketplaceEndToEndTest {
    @Container
    static final PostgreSQLContainer postgres =
            new PostgreSQLContainer(
                    org.testcontainers.utility.DockerImageName.parse(
                                    System.getProperty("test.postgres.image", "postgres:17-alpine"))
                            .asCompatibleSubstituteFor("postgres"));

    @TempDir static Path keys;
    final List<ConfigurableApplicationContext> contexts = new ArrayList<>();
    final ObjectMapper json = new ObjectMapper();
    final String bakery = "20000000-0000-0000-0000-000000000001",
            product = "20000000-0000-0000-0000-000000000002",
            address = "10000000-0000-0000-0000-000000000003";
    int identityPort, marketplacePort, orderPort;
    String customerToken, ownerToken;

    @BeforeAll
    void startServices() throws Exception {
        identityPort = port();
        marketplacePort = port();
        orderPort = port();
        int bakeryPort = port(), subscriptionPort = port(), aiPort = port();
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair pair = generator.generateKeyPair();
        pem("private.pem", "PRIVATE KEY", pair.getPrivate().getEncoded());
        pem("public.pem", "PUBLIC KEY", pair.getPublic().getEncoded());
        String secretHash = new BCryptPasswordEncoder(4).encode("integration-secret");
        try (Connection connection =
                        DriverManager.getConnection(
                                postgres.getJdbcUrl(),
                                postgres.getUsername(),
                                postgres.getPassword());
                Statement statement = connection.createStatement()) {
            for (String name :
                    List.of(
                            "identity",
                            "bakery",
                            "subscription",
                            "cake_ai",
                            "marketplace",
                            "order")) statement.execute("create database " + name + "_e2e");
        }
        List<String> common =
                new ArrayList<>(
                        List.of(
                                "--spring.config.name=isolated-e2e",
                                "--spring.profiles.active=test",
                                "--spring.main.banner-mode=off",
                                "--spring.jpa.hibernate.ddl-auto=validate",
                                "--spring.jpa.open-in-view=false",
                                "--spring.datasource.hikari.maximum-pool-size=2",
                                "--server.tomcat.threads.max=8",
                                "--logging.level.root=WARN",
                                "--platform.security.issuer=bakery-platform-identity",
                                "--platform.security.user-audience=bakery-platform-api",
                                "--platform.security.jwk-set-uri=http://localhost:"
                                        + identityPort
                                        + "/.well-known/jwks.json",
                                "--platform.remote.identity-url=http://localhost:" + identityPort,
                                "--platform.remote.bakery-url=http://localhost:" + bakeryPort,
                                "--platform.remote.subscription-url=http://localhost:"
                                        + subscriptionPort,
                                "--platform.remote.cake-ai-url=http://localhost:" + aiPort,
                                "--platform.remote.marketplace-url=http://localhost:"
                                        + marketplacePort,
                                "--platform.remote.order-url=http://localhost:" + orderPort,
                                "--platform.remote.client-secret=integration-secret",
                                "--platform.remote.connect-timeout=2s",
                                "--platform.remote.read-timeout=10s",
                                "--marketplace.scheduler-delay-ms=3600000"));
        List<String> identity = new ArrayList<>(common);
        identity.addAll(
                List.of(
                        "--security.jwt.private-key-path=" + keys.resolve("private.pem"),
                        "--security.jwt.public-key-path=" + keys.resolve("public.pem"),
                        "--security.jwt.key-id=e2e-key",
                        "--security.jwt.issuer=bakery-platform-identity",
                        "--security.jwt.user-audience=bakery-platform-api",
                        "--security.jwt.service-audience=identity-service",
                        "--security.jwt.access-token-ttl=15m",
                        "--security.auth.refresh-token-ttl=7d",
                        "--security.auth.refresh-cookie-name=refresh_token",
                        "--security.auth.refresh-cookie-path=/api/v1/auth",
                        "--security.auth.refresh-cookie-same-site=Lax",
                        "--security.auth.bcrypt-strength=4",
                        "--security.cors.allowed-origins=http://localhost:5173",
                        "--security.service-clients.clients.marketplace-service.secret-hash="
                                + secretHash,
                        "--security.service-clients.clients.marketplace-service.grants.bakery-service=bakery:profile:read"
                            + " bakery:membership:read bakery:catalog:quote",
                        "--security.service-clients.clients.marketplace-service.grants.subscription-service=subscription:entitlement:read",
                        "--security.service-clients.clients.marketplace-service.grants.cake-ai-service=cake-ai:design:validate",
                        "--security.service-clients.clients.marketplace-service.grants.order-service=order:create-from-offer",
                        "--security.service-clients.clients.order-service.secret-hash="
                                + secretHash,
                        "--security.service-clients.clients.order-service.grants.marketplace-service=marketplace:offer:read",
                        "--security.service-clients.clients.order-service.grants.identity-service=identity:user:read"
                            + " identity:address:read",
                        "--security.service-clients.clients.order-service.grants.bakery-service=bakery:profile:read"));
        start(
                IdentityServiceApplication.class,
                "identity-service",
                "identity",
                identityPort,
                identity);
        fixture(
                "identity",
                Map.of(
                        ":password_hash",
                        "'" + new BCryptPasswordEncoder(4).encode("dev-password") + "'"));
        start(BakeryServiceApplication.class, "bakery-service", "bakery", bakeryPort, common);
        fixture("bakery", Map.of());
        start(
                SubscriptionServiceApplication.class,
                "subscription-service",
                "subscription",
                subscriptionPort,
                common);
        fixture("subscription", Map.of());
        start(CakeAiServiceApplication.class, "cake-ai-service", "cake_ai", aiPort, common);
        start(
                MarketplaceServiceApplication.class,
                "marketplace-service",
                "marketplace",
                marketplacePort,
                common);
        start(OrderServiceApplication.class, "order-service", "order", orderPort, common);
        customerToken = login("customer@example.test");
        ownerToken = login("owner@example.test");
    }

    void start(Class<?> app, String service, String database, int port, List<String> common) {
        List<String> args = new ArrayList<>(common);
        args.addAll(
                List.of(
                        "--server.port=" + port,
                        "--spring.application.name=" + service,
                        "--spring.datasource.url=" + url(database),
                        "--spring.datasource.username=" + postgres.getUsername(),
                        "--spring.datasource.password=" + postgres.getPassword(),
                        "--spring.flyway.locations=filesystem:"
                                + Path.of("../../database/postgresql", service)
                                        .toAbsolutePath()
                                        .normalize(),
                        "--platform.security.audience=" + service,
                        "--platform.remote.client-id=" + service));
        contexts.add(new SpringApplicationBuilder(app).run(args.toArray(String[]::new)));
    }

    String url(String database) {
        return "jdbc:postgresql://"
                + postgres.getHost()
                + ":"
                + postgres.getMappedPort(5432)
                + "/"
                + database
                + "_e2e";
    }

    void fixture(String database, Map<String, String> replacements) throws Exception {
        String filename = database.equals("cake_ai") ? "cake-ai" : database;
        String sql = Files.readString(Path.of("../../database/dev", filename + ".sql"));
        for (var replacement : replacements.entrySet())
            sql = sql.replace(replacement.getKey(), replacement.getValue());
        try (Connection connection =
                        DriverManager.getConnection(
                                url(database), postgres.getUsername(), postgres.getPassword());
                Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    static int port() throws Exception {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }

    static void pem(String name, String label, byte[] bytes) throws Exception {
        Files.writeString(
                keys.resolve(name),
                "-----BEGIN "
                        + label
                        + "-----\n"
                        + Base64.getMimeEncoder(64, new byte[] {10}).encodeToString(bytes)
                        + "\n-----END "
                        + label
                        + "-----\n");
    }

    JsonNode request(int port, String path, String token, Object body) {
        var call =
                RestClient.create()
                        .post()
                        .uri("http://localhost:" + port + path)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON);
        if (token != null) call.header("Authorization", "Bearer " + token);
        return json.readTree(call.body(body).retrieve().body(String.class));
    }

    String login(String email) {
        return request(
                        identityPort,
                        "/api/v1/auth/login",
                        null,
                        Map.of("email", email, "password", "dev-password"))
                .path("data")
                .path("accessToken")
                .asText();
    }

    @Test
    @DisplayName(
            "Open and targeted custom requests create immutable orders through six real REST"
                    + " services")
    void marketplace_realDependencies_completesBothFlows() throws Exception {
        List<Map<String, Object>> orderCommands = new ArrayList<>();
        List<String> orderIds = new ArrayList<>();
        for (boolean targeted : List.of(false, true)) {
            Map<String, Object> body =
                    new HashMap<>(
                            Map.of(
                                    "requestType",
                                    targeted ? "TARGETED_PRODUCT_CUSTOM" : "OPEN_CUSTOM",
                                    "title",
                                    "Chocolate celebration cake",
                                    "description",
                                    "Flowers and candles",
                                    "neededAt",
                                    Instant.now().plusSeconds(172800).toString(),
                                    "deliveryCity",
                                    "HCM",
                                    "deliveryDistrict",
                                    "D1",
                                    "preference",
                                    Map.of(
                                            "flavor",
                                            "Chocolate",
                                            "extraOptions",
                                            Map.of("layers", 2))));
            if (targeted) {
                body.put("targetBakeryId", bakery);
                body.put("baseProductId", product);
                body.put(
                        "optionSelections",
                        List.of(
                                Map.of(
                                        "optionGroupId",
                                        "20000000-0000-0000-0000-000000000004",
                                        "optionValueId",
                                        "20000000-0000-0000-0000-000000000005",
                                        "quantity",
                                        1)));
            }
            String requestId =
                    request(marketplacePort, "/api/v1/cake-requests", customerToken, body)
                            .path("data")
                            .path("id")
                            .asText();
            if (targeted) {
                fixture("cake_ai", Map.of(":request_id", "'" + requestId + "'"));
                RestClient.create()
                        .put()
                        .uri(
                                "http://localhost:"
                                        + marketplacePort
                                        + "/api/v1/cake-requests/"
                                        + requestId
                                        + "/selected-design")
                        .header("Authorization", "Bearer " + customerToken)
                        .body(Map.of("generatedDesignId", "40000000-0000-0000-0000-000000000003"))
                        .retrieve()
                        .toBodilessEntity();
            }
            request(
                    marketplacePort,
                    "/api/v1/cake-requests/" + requestId + "/publish",
                    customerToken,
                    Map.of());
            String offerId =
                    request(
                                    marketplacePort,
                                    "/api/v1/cake-requests/" + requestId + "/offers",
                                    ownerToken,
                                    Map.of(
                                            "bakeryId",
                                            bakery,
                                            "cakePrice",
                                            900000,
                                            "deliveryFee",
                                            30000,
                                            "estimatedCompletionAt",
                                            Instant.now().plusSeconds(3600).toString(),
                                            "expiresAt",
                                            Instant.now().plusSeconds(86400).toString(),
                                            "items",
                                            List.of(
                                                    Map.of(
                                                            "addOnId",
                                                            "20000000-0000-0000-0000-000000000003",
                                                            "quantity",
                                                            2))))
                            .path("data")
                            .path("id")
                            .asText();
            String key = UUID.randomUUID().toString();
            JsonNode first = accept(offerId, key), second = accept(offerId, key);
            assertEquals(first.path("data"), second.path("data"));
            assertEquals("OFFER_SELECTED", first.path("data").path("requestStatus").asText());
            orderCommands.add(
                    Map.of(
                            "offerId",
                            offerId,
                            "cakeRequestId",
                            requestId,
                            "customerId",
                            "10000000-0000-0000-0000-000000000001",
                            "deliveryAddressId",
                            address));
            orderIds.add(first.path("data").path("orderId").asText());
            try (Connection connection =
                            DriverManager.getConnection(
                                    url("order"), postgres.getUsername(), postgres.getPassword());
                    Statement statement = connection.createStatement();
                    ResultSet rows =
                            statement.executeQuery(
                                    "select count(*),max(total_amount) from customer_orders where"
                                            + " offer_id='"
                                            + offerId
                                            + "'")) {
                rows.next();
                assertEquals(1, rows.getInt(1));
                assertEquals(
                        0, new java.math.BigDecimal("970000").compareTo(rows.getBigDecimal(2)));
            }
        }
        try (Connection connection =
                        DriverManager.getConnection(
                                url("bakery"), postgres.getUsername(), postgres.getPassword());
                Statement statement = connection.createStatement()) {
            statement.executeUpdate("update bakeries set name='Renamed Bakery'");
            statement.executeUpdate("update add_ons set name='Renamed Candles',price=123456");
        }
        try (Connection connection =
                        DriverManager.getConnection(
                                url("identity"), postgres.getUsername(), postgres.getPassword());
                Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                    "update users set display_name='Renamed Customer' where"
                        + " id='10000000-0000-0000-0000-000000000001'");
            statement.executeUpdate("delete from user_addresses");
        }
        String serviceToken =
                request(
                                identityPort,
                                "/internal/v1/auth/service-token",
                                null,
                                Map.of(
                                        "clientId",
                                        "marketplace-service",
                                        "clientSecret",
                                        "integration-secret",
                                        "audience",
                                        "order-service",
                                        "scope",
                                        "order:create-from-offer"))
                        .path("accessToken")
                        .asText();
        for (int index = 0; index < orderCommands.size(); index++) {
            var command = orderCommands.get(index);
            var replay =
                    RestClient.create()
                            .post()
                            .uri("http://localhost:" + orderPort + "/internal/v1/orders/from-offer")
                            .header("Authorization", "Bearer " + serviceToken)
                            .header("Idempotency-Key", "accept-offer:" + command.get("offerId"))
                            .body(command)
                            .retrieve()
                            .toEntity(String.class);
            assertEquals(200, replay.getStatusCode().value());
            assertEquals(
                    orderIds.get(index), json.readTree(replay.getBody()).path("orderId").asText());
        }
        try (Connection connection =
                        DriverManager.getConnection(
                                url("order"), postgres.getUsername(), postgres.getPassword());
                Statement statement = connection.createStatement()) {
            try (ResultSet rows =
                    statement.executeQuery(
                            "select count(*) from customer_orders where bakery_name_snapshot='Test"
                                + " Bakery' and customer_name_snapshot='Test Customer' and"
                                + " total_amount=970000")) {
                rows.next();
                assertEquals(2, rows.getInt(1));
            }
            try (ResultSet rows =
                    statement.executeQuery(
                            "select count(*) from order_items where item_type='ADD_ON' and"
                                + " name_snapshot='Candles' and unit_price=20000")) {
                rows.next();
                assertEquals(2, rows.getInt(1));
            }
        }
    }

    JsonNode accept(String offer, String key) {
        String response =
                RestClient.create()
                        .post()
                        .uri(
                                "http://localhost:"
                                        + marketplacePort
                                        + "/api/v1/offers/"
                                        + offer
                                        + "/accept")
                        .header("Authorization", "Bearer " + customerToken)
                        .header("Idempotency-Key", key)
                        .body(Map.of("deliveryAddressId", address))
                        .retrieve()
                        .body(String.class);
        return json.readTree(response);
    }

    @AfterAll
    void stop() {
        for (var context : contexts.reversed()) context.close();
    }
}
