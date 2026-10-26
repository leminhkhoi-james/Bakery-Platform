package com.se193262.platform.client;

import static org.junit.jupiter.api.Assertions.*;

import com.se193262.platform.config.RemoteProperties;
import com.se193262.platform.exception.BusinessException;
import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.*;

import java.net.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

class ServiceHttpClientTest {
    HttpServer server;
    String base;
    final AtomicInteger tokens = new AtomicInteger(), calls = new AtomicInteger();

    @BeforeEach
    void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext(
                "/internal/v1/auth/service-token",
                exchange -> {
                    tokens.incrementAndGet();
                    byte[] body = "{\"accessToken\":\"test-token\",\"expiresIn\":300}".getBytes();
                    exchange.getResponseHeaders().add("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, body.length);
                    exchange.getResponseBody().write(body);
                    exchange.close();
                });
        server.start();
        base = "http://localhost:" + server.getAddress().getPort();
    }

    @AfterEach
    void stop() {
        server.stop(0);
        org.slf4j.MDC.clear();
    }

    ServiceHttpClient client(Duration timeout) {
        return new ServiceHttpClient(
                new RemoteProperties(
                        base,
                        base,
                        base,
                        base,
                        base,
                        base,
                        "test-client",
                        "test-secret",
                        Duration.ofSeconds(1),
                        timeout));
    }

    @Test
    @DisplayName("Internal HTTP propagates bearer/correlation and caches tokens")
    void get_validResponse_reusesToken() {
        server.createContext(
                "/context",
                exchange -> {
                    calls.incrementAndGet();
                    assertEquals(
                            "Bearer test-token",
                            exchange.getRequestHeaders().getFirst("Authorization"));
                    assertNotNull(exchange.getRequestHeaders().getFirst("X-Correlation-Id"));
                    byte[] body = "{\"active\":true}".getBytes();
                    exchange.getResponseHeaders().add("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, body.length);
                    exchange.getResponseBody().write(body);
                    exchange.close();
                });
        var client = client(Duration.ofSeconds(2));
        assertEquals(
                true,
                client.get(base, "/context", "bakery-service", "read", Map.class).get("active"));
        client.get(base, "/context", "bakery-service", "read", Map.class);
        assertEquals(1, tokens.get());
        assertEquals(2, calls.get());
    }

    @Test
    @DisplayName("A failed POST is mapped to 503 without automatic retry")
    void post_remoteFailure_doesNotRetry() {
        server.createContext(
                "/create",
                exchange -> {
                    calls.incrementAndGet();
                    exchange.sendResponseHeaders(503, -1);
                    exchange.close();
                });
        var error =
                assertThrows(
                        BusinessException.class,
                        () ->
                                client(Duration.ofSeconds(2))
                                        .post(
                                                base,
                                                "/create",
                                                "order-service",
                                                "write",
                                                Map.of("id", 1),
                                                "stable-key",
                                                Map.class));
        assertEquals(503, error.status());
        assertEquals(1, calls.get());
        assertFalse(error.getMessage().contains(base));
    }

    @Test
    @DisplayName("HTTP read timeout maps to an unavailable dependency")
    void get_timeout_returns503() {
        server.createContext(
                "/slow",
                exchange -> {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                    exchange.close();
                });
        var error =
                assertThrows(
                        BusinessException.class,
                        () ->
                                client(Duration.ofMillis(100))
                                        .get(base, "/slow", "bakery-service", "read", Map.class));
        assertEquals(503, error.status());
    }
}
