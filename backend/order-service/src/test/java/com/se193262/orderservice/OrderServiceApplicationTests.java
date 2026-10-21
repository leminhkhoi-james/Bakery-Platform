package com.se193262.orderservice;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
@Import(OrderServiceApplicationTests.TestJwtConfiguration.class)
class OrderServiceApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    @DisplayName("Order Service starts, applies Flyway schema, and validates entities")
    void contextLoads() {
    }

    @Test
    @DisplayName("OpenAPI lists public, review, and internal order endpoints")
    void openApiListsOrderEndpoints() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/v3/api-docs"))
                .GET()
                .build();
        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("/api/v1/orders/direct"));
        assertTrue(response.body().contains("/api/v1/orders/{orderId}/review"));
        assertTrue(response.body().contains("/api/v1/admin/reviews/{orderId}/status"));
        assertTrue(response.body().contains("/internal/v1/orders/from-offer"));
    }

    @Test
    @DisplayName("Order query, fulfillment transitions, reviews, and internal context work over HTTP")
    void orderAndReviewLifecycleWorksOverHttp() throws Exception {
        UUID orderId = UUID.randomUUID();
        UUID customerId = UUID.fromString("4ccca4ab-50a8-4d37-9a25-d95450f7b77f");
        UUID bakeryId = UUID.fromString("f22b255f-cdd7-4f1e-946d-4f1309c70e34");
        seedPendingOrder(orderId, customerId, bakeryId);

        HttpResponse<String> unauthenticated = request("GET", "/api/v1/orders?scope=mine", null, null);
        assertEquals(401, unauthenticated.statusCode());

        HttpResponse<String> forbiddenAdminList = request(
            "GET", "/api/v1/orders?scope=all", null, "customer-token");
        assertEquals(403, forbiddenAdminList.statusCode());

        HttpResponse<String> userOnInternalRoute = request(
            "GET", "/internal/v1/orders/" + orderId + "/context", null, "customer-token");
        assertEquals(403, userOnInternalRoute.statusCode());

        HttpResponse<String> serviceTokenOnPublicRoute = request(
            "GET", "/api/v1/orders?scope=all", null, "service-token");
        assertEquals(403, serviceTokenOnPublicRoute.statusCode());

        HttpResponse<String> customerOnAdminRoute = request(
            "PATCH", "/api/v1/admin/reviews/" + orderId + "/status",
            "{\"status\":\"HIDDEN\"}", "customer-token");
        assertEquals(403, customerOnAdminRoute.statusCode());

        HttpResponse<String> adminAllOrders = request(
            "GET", "/api/v1/orders?scope=all", null, "admin-token");
        assertEquals(200, adminAllOrders.statusCode(), adminAllOrders.body());

        HttpResponse<String> mine = request("GET", "/api/v1/orders?scope=mine", null, "customer-token");
        assertEquals(200, mine.statusCode());
        assertTrue(mine.body().contains(orderId.toString()));

        HttpResponse<String> details = request("GET", "/api/v1/orders/" + orderId, null, "customer-token");
        assertEquals(200, details.statusCode());
        assertTrue(details.body().contains("PENDING"));

        for (String targetStatus : List.of("CONFIRMED", "BAKING", "READY", "DELIVERING", "COMPLETED")) {
            HttpResponse<String> transition = request("POST", "/api/v1/orders/" + orderId + "/status-transitions",
                    "{\"targetStatus\":\"" + targetStatus + "\",\"reason\":\"integration test\"}", "admin-token");
            assertEquals(200, transition.statusCode(), transition.body());
            assertTrue(transition.body().contains(targetStatus));
        }

        HttpResponse<String> createReview = request("POST", "/api/v1/orders/" + orderId + "/review",
            "{\"rating\":5,\"comment\":\"Great cake\"}", "customer-token");
        assertEquals(201, createReview.statusCode(), createReview.body());

        HttpResponse<String> updateReview = request("PATCH", "/api/v1/orders/" + orderId + "/review",
            "{\"rating\":4,\"comment\":\"Updated review\"}", "customer-token");
        assertEquals(200, updateReview.statusCode(), updateReview.body());

        HttpResponse<String> hideReview = request("PATCH", "/api/v1/admin/reviews/" + orderId + "/status",
            "{\"status\":\"HIDDEN\"}", "admin-token");
        assertEquals(200, hideReview.statusCode(), hideReview.body());
        HttpResponse<String> publishReview = request("PATCH", "/api/v1/admin/reviews/" + orderId + "/status",
            "{\"status\":\"PUBLISHED\"}", "admin-token");
        assertEquals(200, publishReview.statusCode(), publishReview.body());

        HttpResponse<String> context = request(
            "GET", "/internal/v1/orders/" + orderId + "/context", null, "service-token");
        assertEquals(200, context.statusCode());
        assertTrue(context.body().contains("\"reviewEligible\":false"));

        HttpResponse<String> deleteReview = request("DELETE", "/api/v1/orders/" + orderId + "/review", null, "customer-token");
        assertEquals(204, deleteReview.statusCode());
        HttpResponse<String> afterDelete = request("GET", "/api/v1/orders/" + orderId, null, "customer-token");
        assertEquals(200, afterDelete.statusCode());
        assertTrue(afterDelete.body().contains("DELETED"));
    }

    private HttpResponse<String> request(String method, String path, String body, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (body == null) {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(body));
        }
        return HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private void seedPendingOrder(UUID orderId, UUID customerId, UUID bakeryId) {
        Instant now = Instant.now();
        jdbcTemplate.update("""
                INSERT INTO customer_orders (
                    id, order_number, customer_id, bakery_id, order_source,
                    customer_name_snapshot, customer_phone_snapshot, bakery_name_snapshot,
                    subtotal, delivery_fee, total_amount, currency, status, needed_at,
                    created_at, updated_at, version)
                VALUES (?, ?, ?, ?, 'DIRECT_CATALOG', 'Test Customer', '+84900000000', 'Test Bakery',
                    ?, ?, ?, 'VND', 'PENDING', ?, ?, ?, 0)
                """, orderId, "ORD-" + orderId.toString().replace("-", "").substring(0, 20), customerId,
                bakeryId, new BigDecimal("100.00"), BigDecimal.ZERO, new BigDecimal("100.00"),
                now.plusSeconds(7200), now, now);
        jdbcTemplate.update("""
                INSERT INTO delivery_address_snapshots (
                    order_id, recipient_name, recipient_phone, address_line, district, city)
                VALUES (?, 'Test Recipient', '+84900000000', '123 Test Street', 'District 1', 'HCMC')
                """, orderId);
        jdbcTemplate.update("""
                INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, changed_at)
                VALUES (?, NULL, 'PENDING', ?, 'Order created', ?)
                """, orderId, customerId, now);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestJwtConfiguration {

        @Bean
        @Primary
        JwtDecoder testJwtDecoder() {
            return token -> {
                boolean serviceToken = "service-token".equals(token);
                List<String> roles = switch (token) {
                    case "admin-token" -> List.of("ADMIN", "CUSTOMER");
                    case "customer-token" -> List.of("CUSTOMER");
                    default -> List.of();
                };
                Jwt.Builder builder = Jwt.withTokenValue(token)
                        .header("alg", "none")
                        .subject("4ccca4ab-50a8-4d37-9a25-d95450f7b77f")
                        .claim("token_type", serviceToken ? "service" : "user")
                        .claim("aud", List.of(serviceToken ? "order-service" : "bakery-platform-api"))
                        .claim("roles", roles)
                        .issuedAt(Instant.now())
                        .expiresAt(Instant.now().plusSeconds(3600));
                if (serviceToken) {
                    builder.claim("scope", "order:context:read order:create-from-offer");
                }
                return builder.build();
            };
        }
    }
}

