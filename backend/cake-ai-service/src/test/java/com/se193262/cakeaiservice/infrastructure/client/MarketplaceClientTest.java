package com.se193262.cakeaiservice.infrastructure.client;

import static org.junit.jupiter.api.Assertions.*;
import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.config.RemoteProperties;
import com.se193262.platform.exception.BusinessException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.UUID;

class MarketplaceClientTest {
    HttpServer server;
    MarketplaceClient client;
    int contextStatus = 200, tokenStatus = 200, delay;
    UUID requestId = UUID.randomUUID(), customerId = UUID.randomUUID();
    String context;

    @BeforeEach void start() throws Exception {
        context = "{\"id\":\"" + requestId + "\",\"customerId\":\"" + customerId
                + "\",\"status\":\"DRAFT\",\"aiEligible\":true}";
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/internal/v1/auth/service-token", exchange -> {
            byte[] body = "{\"accessToken\":\"synthetic-loopback-only\",\"expiresIn\":300}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(tokenStatus, body.length);
            exchange.getResponseBody().write(body); exchange.close();
        });
        server.createContext("/internal/v1/cake-requests/", exchange -> {
            try {
                Thread.sleep(delay);
                byte[] body = context.getBytes();
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(contextStatus, body.length);
                exchange.getResponseBody().write(body);
            } catch (Exception ignored) { /* The timeout test closes the connection. */ }
            finally { exchange.close(); }
        });
        server.start();
        client = client("http://127.0.0.1:" + server.getAddress().getPort());
    }

    MarketplaceClient client(String base) {
        return client(base, Duration.ofSeconds(2));
    }

    MarketplaceClient client(String base, Duration readTimeout) {
        return new MarketplaceClient(new ServiceHttpClient(new RemoteProperties(base, base, base, base,
                base, base, "cake-ai-service", "synthetic-loopback-only", Duration.ofSeconds(1), readTimeout)));
    }

    @AfterEach void stop() { server.stop(0); }

    @Test @DisplayName("Only positively verified eligible owners may generate")
    void validate_owner_allowsDraftAndOpen() {
        assertDoesNotThrow(() -> client.validate(requestId, customerId));
        context = context.replace("DRAFT", "OPEN");
        assertDoesNotThrow(() -> client.validate(requestId, customerId));
    }

    @ParameterizedTest @ValueSource(ints = {401, 403, 404, 409, 422, 429, 500, 502, 503})
    @DisplayName("Every upstream error fails closed")
    void validate_remoteError_rejects(int status) {
        contextStatus = status;
        BusinessException error = assertThrows(BusinessException.class, () -> client.validate(requestId, customerId));
        assertEquals(status == 404 || status == 409 || status == 422 ? status : 503, error.status());
    }

    @ParameterizedTest @ValueSource(ints = {401, 403})
    @DisplayName("Invalid internal identity or grant never authorizes generation")
    void validate_tokenDenied_rejects(int status) {
        tokenStatus = status;
        assertEquals(503, assertThrows(BusinessException.class, () -> client.validate(requestId, customerId)).status());
    }

    @Test @DisplayName("Wrong owner and ineligible or inconsistent context are rejected")
    void validate_untrustedContext_rejects() {
        assertEquals(403, assertThrows(BusinessException.class, () -> client.validate(requestId, UUID.randomUUID())).status());
        context = context.replace("DRAFT", "CLOSED");
        assertEquals(422, assertThrows(BusinessException.class, () -> client.validate(requestId, customerId)).status());
        context = "{}";
        assertThrows(BusinessException.class, () -> client.validate(requestId, customerId));
    }

    @Test @DisplayName("Timeout and connection refusal never authorize generation")
    void validate_networkFailure_rejects() {
        client.validate(requestId, customerId);
        client = client("http://127.0.0.1:" + server.getAddress().getPort(), Duration.ofMillis(150));
        delay = 700;
        assertEquals(503, assertThrows(BusinessException.class, () -> client.validate(requestId, customerId)).status());
        assertEquals(503, assertThrows(BusinessException.class, () -> client("http://127.0.0.1:1").validate(requestId, customerId)).status());
    }
}
