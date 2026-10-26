package com.se193262.bakeryservice.infrastructure.client;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.platform.client.ServiceHttpClient;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.mock;

class IdentityUserClientTest {
    private HttpServer server;
    private IdentityUserClient client;
    private String response;
    private int status;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setup() throws Exception {
        status = 200;
        response = profile("BAKERY_OWNER");
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/internal/v1/users/", exchange -> {
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        client = new IdentityUserClient("http://localhost:" + server.getAddress().getPort(),
                "test-bearer", mock(ServiceHttpClient.class));
    }

    @AfterEach
    void stop() { if (server != null) server.stop(0); }

    @Test
    @DisplayName("Identity profile includes the display name even with other response fields")
    void requireOwner_validProfile_returnsDisplayName() {
        assertThat(client.requireOwner(userId).displayName()).isEqualTo("Bakery owner");
    }

    @Test
    @DisplayName("Customer cannot become a bakery member through the internal profile lookup")
    void requireEligibleMember_customer_returns422() {
        response = profile("CUSTOMER");
        assertThatThrownBy(() -> client.requireEligibleMember(userId)).isInstanceOfSatisfying(
                AppException.class, exception -> assertThat(exception.getStatus().value()).isEqualTo(422));
    }

    @Test
    @DisplayName("Identity failure prevents creating an unchecked owner")
    void requireOwner_identityUnavailable_returns503() {
        status = 500;
        response = "{}";
        assertThatThrownBy(() -> client.requireOwner(userId)).isInstanceOfSatisfying(
                AppException.class, exception -> assertThat(exception.getStatus().value()).isEqualTo(503));
    }

    private String profile(String role) {
        return """
                {"id":"%s","displayName":"Bakery owner","status":"ACTIVE",
                 "roles":["%s"],"email":"owner@example.test","phoneNumber":"0900000000"}
                """.formatted(userId, role);
    }
}
