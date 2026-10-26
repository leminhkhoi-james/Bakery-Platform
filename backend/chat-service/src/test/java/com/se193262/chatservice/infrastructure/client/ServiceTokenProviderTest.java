package com.se193262.chatservice.infrastructure.client;

import com.se193262.chatservice.config.ServiceClientProperties;
import com.se193262.chatservice.exception.ChatException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServiceTokenProviderTest {

    private HttpServer server;
    private String identityUrl;
    private final AtomicInteger tokenRequests = new AtomicInteger();

    @BeforeEach
    void startIdentityStub() throws Exception {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/internal/v1/auth/service-token", exchange -> {
            tokenRequests.incrementAndGet();
            String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(request.contains("\"clientId\":\"chat-service\""));
            assertTrue(request.contains("\"clientSecret\":\"test-secret\""));
            assertTrue(request.contains("\"audience\":\"marketplace-service\""));
            assertTrue(request.contains("\"scope\":\"marketplace:request:chat:authorize\"")
                    || request.contains("\"scope\":\"marketplace:request:read\""));
            assertEquals("chat-test-correlation-id",
                    exchange.getRequestHeaders().getFirst("X-Correlation-Id"));
            byte[] body = "{\"accessToken\":\"scoped-token\",\"expiresIn\":300}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        identityUrl = "http://localhost:" + server.getAddress().getPort();
    }

    @AfterEach
    void stopIdentityStub() {
        server.stop(0);
        org.slf4j.MDC.clear();
    }

    @Test
    void token_cachesByAudienceAndScope() {
        org.slf4j.MDC.put("correlationId", "chat-test-correlation-id");
        ServiceTokenProvider provider = provider();

        assertEquals("scoped-token", provider.token("marketplace-service",
                "marketplace:request:chat:authorize"));
        assertEquals("scoped-token", provider.token("marketplace-service",
                "marketplace:request:chat:authorize"));
        assertEquals(1, tokenRequests.get());
    }

    @Test
    void token_doesNotReuseAcrossScopes() {
        org.slf4j.MDC.put("correlationId", "chat-test-correlation-id");
        ServiceTokenProvider provider = provider();

        provider.token("marketplace-service", "marketplace:request:chat:authorize");
        provider.token("marketplace-service", "marketplace:request:read");

        assertEquals(2, tokenRequests.get());
    }

    @Test
    void identityFailureMapsToServiceUnavailable() {
        server.removeContext("/internal/v1/auth/service-token");
        server.createContext("/internal/v1/auth/service-token", exchange -> {
            tokenRequests.incrementAndGet();
            exchange.sendResponseHeaders(401, -1);
            exchange.close();
        });

        ChatException exception = assertThrows(ChatException.class,
                () -> provider().token("marketplace-service", "marketplace:request:chat:authorize"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertEquals("Identity service-token issuance is unavailable", exception.getMessage());
    }

    private ServiceTokenProvider provider() {
        var service = new ServiceClientProperties.Service(
                "http://localhost:8082", "marketplace-service", "marketplace:request:chat:authorize");
        return new ServiceTokenProvider(new ServiceClientProperties(
                identityUrl,
                "chat-service",
                "test-secret",
                service,
                new ServiceClientProperties.Service(
                        "http://localhost:8083", "bakery-service", "bakery:membership:read"),
                Duration.ofSeconds(1),
                Duration.ofSeconds(2)));
    }
}
