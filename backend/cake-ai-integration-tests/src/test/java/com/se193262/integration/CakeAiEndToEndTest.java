package com.se193262.integration;

import static org.junit.jupiter.api.Assertions.*;
import com.se193262.cakeaiservice.CakeAiServiceApplication;
import com.se193262.cakeaiservice.feature.generation.*;
import com.se193262.cakeaiservice.infrastructure.client.ImageProvider.Moderation;
import com.se193262.identityservice.IdentityServiceApplication;
import com.se193262.marketplaceservice.MarketplaceServiceApplication;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.*;
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
class CakeAiEndToEndTest {
    @Container static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");
    @TempDir static Path keys;
    final List<ConfigurableApplicationContext> contexts = new ArrayList<>();
    final ObjectMapper json = new ObjectMapper();
    int identityPort, marketplacePort, aiPort;
    String customerToken, otherToken;
    ConfigurableApplicationContext ai;

    @BeforeAll void start() throws Exception {
        identityPort = port(); marketplacePort = port(); aiPort = port();
        var generator = KeyPairGenerator.getInstance("RSA"); generator.initialize(2048);
        var pair = generator.generateKeyPair();
        pem("private.pem", "PRIVATE KEY", pair.getPrivate().getEncoded());
        pem("public.pem", "PUBLIC KEY", pair.getPublic().getEncoded());
        try (var connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
                var statement = connection.createStatement()) {
            for (String database : List.of("identity", "marketplace", "cake_ai")) statement.execute("create database " + database + "_ai_test");
        }
        String hash = new BCryptPasswordEncoder(4).encode("test-secret");
        startService(IdentityServiceApplication.class, "identity-service", "identity", identityPort, List.of(
                "--security.jwt.private-key-path=" + keys.resolve("private.pem"),
                "--security.jwt.public-key-path=" + keys.resolve("public.pem"),
                "--security.jwt.key-id=test-key", "--security.jwt.issuer=bakery-platform-identity",
                "--security.jwt.user-audience=bakery-platform-api", "--security.jwt.service-audience=identity-service",
                "--security.jwt.access-token-ttl=15m", "--security.auth.refresh-token-ttl=7d",
                "--security.auth.refresh-cookie-name=refresh_token", "--security.auth.refresh-cookie-path=/api/v1/auth",
                "--security.auth.refresh-cookie-same-site=Lax", "--security.auth.bcrypt-strength=4",
                "--security.cors.allowed-origins=http://localhost:5173",
                "--security.service-clients.clients.marketplace-service.secret-hash=" + hash,
                "--security.service-clients.clients.marketplace-service.grants.cake-ai-service=cake-ai:design:validate cake-ai:unrelated",
                "--security.service-clients.clients.cake-ai-service.secret-hash=" + hash,
                "--security.service-clients.clients.cake-ai-service.grants.marketplace-service=marketplace:request:read"));
        startService(MarketplaceServiceApplication.class, "marketplace-service", "marketplace", marketplacePort, List.of());
        ai = startService(CakeAiServiceApplication.class, "cake-ai-service", "cake_ai", aiPort, List.of());
        for (String email : List.of("customer@cake.test", "other@cake.test")) post(identityPort, "/api/v1/auth/register", null,
                Map.of("email", email, "password", "test-password", "displayName", "AI customer"));
        customerToken = login("customer@cake.test"); otherToken = login("other@cake.test");
    }

    ConfigurableApplicationContext startService(Class<?> app, String service, String database, int port, List<String> additional) {
        List<String> args = new ArrayList<>(List.of("--spring.config.name=isolated-ai-test", "--spring.profiles.active=test",
                "--spring.main.banner-mode=off", "--server.port=" + port, "--spring.application.name=" + service,
                "--spring.datasource.url=jdbc:postgresql://" + postgres.getHost() + ":" + postgres.getMappedPort(5432) + "/" + database + "_ai_test",
                "--spring.datasource.username=" + postgres.getUsername(), "--spring.datasource.password=" + postgres.getPassword(),
                "--spring.datasource.hikari.maximum-pool-size=3", "--spring.jpa.hibernate.ddl-auto=validate",
                "--spring.jpa.open-in-view=false", "--spring.flyway.locations=filesystem:"
                        + Path.of("../../database/postgresql", service).toAbsolutePath().normalize(),
                "--logging.level.root=WARN", "--platform.security.audience=" + service,
                "--platform.security.issuer=bakery-platform-identity", "--platform.security.user-audience=bakery-platform-api",
                "--platform.security.jwk-set-uri=http://localhost:" + identityPort + "/.well-known/jwks.json",
                "--platform.remote.identity-url=http://localhost:" + identityPort,
                "--platform.remote.marketplace-url=http://localhost:" + marketplacePort,
                "--platform.remote.cake-ai-url=http://localhost:" + aiPort,
                "--platform.remote.bakery-url=http://localhost:1", "--platform.remote.subscription-url=http://localhost:1",
                "--platform.remote.order-url=http://localhost:1", "--platform.remote.client-id=" + service,
                "--platform.remote.client-secret=test-secret", "--platform.remote.connect-timeout=2s",
                "--platform.remote.read-timeout=5s", "--marketplace.scheduler-delay-ms=3600000", "--cake-ai.scheduler-enabled=false"));
        args.addAll(additional);
        var builder = new SpringApplicationBuilder(app);
        if (app == CakeAiServiceApplication.class) builder.sources(CakeAiTestAdapters.class);
        var context = builder.run(args.toArray(String[]::new)); contexts.add(context); return context;
    }

    @Test @DisplayName("Customer generates an approved design and selects it through authenticated service calls")
    void generate_realJwt_selectsOnlyApprovedDesigns() {
        String requestId = post(marketplacePort, "/api/v1/cake-requests", customerToken,
                Map.of("requestType", "OPEN_CUSTOM", "title", "AI cake", "description", "Pink flowers",
                        "neededAt", Instant.now().plusSeconds(172800).toString(), "deliveryCity", "HCM", "deliveryDistrict", "D1"))
                .path("data").path("id").asText();
        var fake = ai.getBean(CakeAiTestAdapters.FakeProvider.class);
        for (Moderation moderation : Moderation.values()) {
            fake.outputDecision = moderation;
            var multipart = new LinkedMultiValueMap<String, Object>();
            var headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            multipart.add("metadata", new org.springframework.http.HttpEntity<>(
                    Map.of("cakeRequestId", requestId, "prompt", "Pastel flower cake"), headers));
            String key = UUID.randomUUID().toString();
            JsonNode first = createJob(multipart, key);
            String jobId = first.path("data").path("id").asText();
            ai.getBean(GenerationWorker.class).run(ai.getBean(GenerationQueue.class).claim().orElseThrow());
            assertEquals(first.path("data"), createJob(multipart, key).path("data"));
            var detail = get(aiPort, "/api/v1/generation-jobs/" + jobId, customerToken).path("data");
            assertEquals("SUCCEEDED", detail.path("job").path("status").asText());
            var design = detail.path("generatedDesigns").get(0);
            assertEquals(moderation.name(), design.path("moderationStatus").asText());
            var selection = RestClient.create().put().uri(url(marketplacePort, "/api/v1/cake-requests/" + requestId + "/selected-design"))
                    .header("Authorization", "Bearer " + customerToken).body(Map.of("generatedDesignId", design.path("id").asText()));
            if (moderation == Moderation.APPROVED) {
                assertEquals(design.path("id").asText(), json.readTree(selection.retrieve().body(String.class))
                        .path("data").path("selectedDesignId").asText());
                assertFalse(design.path("imageUrl").isNull());
            } else {
                assertTrue(design.path("imageUrl").isNull());
                assertEquals(422, assertThrows(HttpClientErrorException.class,
                        () -> selection.retrieve().toBodilessEntity()).getStatusCode().value());
            }
            assertEquals(403, assertThrows(HttpClientErrorException.class,
                    () -> get(aiPort, "/api/v1/generation-jobs/" + jobId, otherToken)).getStatusCode().value());
        }
        String serviceToken = post(identityPort, "/internal/v1/auth/service-token", null,
                Map.of("clientId", "marketplace-service", "clientSecret", "test-secret", "audience", "cake-ai-service",
                        "scope", "cake-ai:unrelated")).path("accessToken").asText();
        assertEquals(403, assertThrows(HttpClientErrorException.class,
                () -> get(aiPort, "/internal/v1/cake-requests/" + requestId + "/generation-context", serviceToken)).getStatusCode().value());
    }

    JsonNode createJob(LinkedMultiValueMap<String, Object> body, String key) {
        return json.readTree(RestClient.create().post().uri(url(aiPort, "/api/v1/generation-jobs"))
                .header("Authorization", "Bearer " + customerToken).header("Idempotency-Key", key)
                .body(body).retrieve().body(String.class));
    }
    JsonNode post(int port, String path, String token, Object body) {
        var call = RestClient.create().post().uri(url(port, path)).contentType(MediaType.APPLICATION_JSON);
        if (token != null) call.header("Authorization", "Bearer " + token);
        return json.readTree(call.body(body).retrieve().body(String.class));
    }
    JsonNode get(int port, String path, String token) {
        return json.readTree(RestClient.create().get().uri(url(port, path)).header("Authorization", "Bearer " + token)
                .retrieve().body(String.class));
    }
    String login(String email) { return post(identityPort, "/api/v1/auth/login", null,
            Map.of("email", email, "password", "test-password")).path("data").path("accessToken").asText(); }
    String url(int port, String path) { return "http://localhost:" + port + path; }
    static int port() throws Exception { try (var socket = new ServerSocket(0)) { return socket.getLocalPort(); } }
    static void pem(String name, String label, byte[] bytes) throws Exception {
        Files.writeString(keys.resolve(name), "-----BEGIN " + label + "-----\n"
                + Base64.getMimeEncoder(64, new byte[]{10}).encodeToString(bytes) + "\n-----END " + label + "-----\n");
    }
    @AfterAll void stop() { for (int index = contexts.size() - 1; index >= 0; index--) contexts.get(index).close(); }
}
