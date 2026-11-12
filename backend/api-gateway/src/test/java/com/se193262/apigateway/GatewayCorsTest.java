package com.se193262.apigateway;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "gateway.cors.allowed-origins=http://localhost:5173,http://localhost:5174")
@ActiveProfiles("test")
class GatewayCorsTest {
    private static final AtomicInteger calls = new AtomicInteger();
    private static final HttpServer upstream = startUpstream();
    @LocalServerPort private int port;
    private final HttpClient client = HttpClient.newHttpClient();

    @DynamicPropertySource
    static void urls(DynamicPropertyRegistry registry) {
        for (String service : new String[]{"identity", "bakery", "marketplace", "subscription", "cake-ai", "order", "chat"}) {
            registry.add("services." + service + ".url", () -> "http://127.0.0.1:" + upstream.getAddress().getPort());
        }
    }

    @AfterAll static void stopUpstream() { upstream.stop(0); }

    @Test
    void preflightIsHandledWithoutCallingDownstream() throws Exception {
        int before = calls.get();
        var response = client.send(HttpRequest.newBuilder(uri("/bakery/api/v1/bakeries"))
                .header("Origin", "http://localhost:5174")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,Idempotency-Key")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).hasValue("http://localhost:5174");
        assertThat(response.headers().firstValue("Access-Control-Allow-Credentials")).hasValue("true");
        assertThat(calls.get()).isEqualTo(before);
    }

    @Test
    void proxyKeepsOneCorsHeaderWhenDownstreamAlsoSendsCors() throws Exception {
        var response = client.send(HttpRequest.newBuilder(uri("/bakery/api/v1/bakeries"))
                .header("Origin", "http://localhost:5173").GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("upstream-ok");
        assertThat(response.headers().allValues("Access-Control-Allow-Origin")).containsExactly("http://localhost:5173");
        assertThat(response.headers().allValues("Access-Control-Allow-Credentials")).containsExactly("true");
    }

    @Test
    void unapprovedPreflightDoesNotCallDownstream() throws Exception {
        int before = calls.get();
        var response = client.send(HttpRequest.newBuilder(uri("/bakery/api/v1/bakeries"))
                .header("Origin", "https://unapproved.example")
                .header("Access-Control-Request-Method", "POST")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isEmpty();
        assertThat(calls.get()).isEqualTo(before);
    }

    @Test
    void swaggerUiAndSevenServiceDefinitionsAreAvailable() throws Exception {
        var ui = client.send(HttpRequest.newBuilder(uri("/swagger-ui/index.html")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(ui.statusCode()).isEqualTo(200);
        assertThat(ui.body()).contains("Swagger UI");
        var config = client.send(HttpRequest.newBuilder(uri("/v3/api-docs/swagger-config")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(config.statusCode()).isEqualTo(200);
        for (String service : new String[] {"identity", "bakery", "marketplace", "subscription", "cake-ai", "orders", "chat"}) {
            assertThat(config.body()).contains("/" + service + "/v3/api-docs");
        }
    }

    private URI uri(String path) { return URI.create("http://127.0.0.1:" + port + path); }

    @DisplayName("All seven Swagger definitions use the shared root API path")
    @ParameterizedTest
    @ValueSource(strings = {"identity", "bakery", "marketplace", "subscription", "cake-ai", "orders", "chat"})
    void swaggerProxy_serviceDefinition_forwardsRootPrefix(String service) throws Exception {
        var response = client.send(HttpRequest.newBuilder(uri("/" + service + "/v3/api-docs")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("/");
    }

    private static HttpServer startUpstream() {
        try {
            var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/", exchange -> {
                calls.incrementAndGet();
                var origin = exchange.getRequestHeaders().getFirst("Origin");
                if (origin != null) exchange.getResponseHeaders().add("Access-Control-Allow-Origin", origin);
                exchange.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
                if ("OPTIONS".equals(exchange.getRequestMethod())) {
                    exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST");
                    exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Authorization,Idempotency-Key");
                    exchange.sendResponseHeaders(200, -1);
                    exchange.close();
                    return;
                }
                String payload = "/v3/api-docs".equals(exchange.getRequestURI().getPath())
                        ? String.join(",", exchange.getRequestHeaders().getOrDefault("X-Forwarded-Prefix", java.util.List.of()))
                        : "upstream-ok";
                byte[] body = payload.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, body.length);
                try (var output = exchange.getResponseBody()) { output.write(body); }
            });
            server.start();
            return server;
        } catch (IOException error) { throw new IllegalStateException(error); }
    }
}
