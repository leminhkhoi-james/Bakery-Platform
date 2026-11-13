package com.se193262.apigateway;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GatewayRoutingTest {
    private static final AtomicInteger calls = new AtomicInteger();
    private static final Map<String, HttpServer> upstreams = startUpstreams();
    private final HttpClient client = HttpClient.newHttpClient();
    @LocalServerPort private int port;

    @DynamicPropertySource
    static void urls(DynamicPropertyRegistry registry) {
        upstreams.forEach((name, server) -> registry.add("services." + name + ".url",
                () -> "http://127.0.0.1:" + server.getAddress().getPort()));
    }

    @AfterAll
    static void stopUpstreams() { upstreams.values().forEach(server -> server.stop(0)); }

    @DisplayName("Public API routes preserve paths and select the owning service")
    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
            "/api/v1/bakeries,bakery", "/api/v1/bakeries/shop/products,bakery",
            "/api/v1/products/cake,bakery", "/api/v1/admin/bakeries/shop/approve,bakery",
            "/api/v1/bakeries/shop/subscription,subscription",
            "/api/v1/bakeries/shop/subscription-orders,subscription",
            "/api/v1/subscription-plans,subscription",
            "/api/v1/subscription-orders/order/payments,subscription",
            "/api/v1/payments/vnpay/ipn,subscription",
            "/api/v1/admin/subscription-orders,subscription", "/api/v1/admin/bakery-payments,subscription",
            "/api/v1/admin/vnpay-attempts,subscription", "/api/v1/admin/subscription-plans,subscription",
            "/api/v1/auth/login,identity", "/api/v1/users/me,identity", "/api/v1/admin/users,identity",
            "/api/v1/cake-requests/request/offers,marketplace", "/api/v1/offers/offer/accept,marketplace",
            "/api/v1/orders/order/review,order", "/api/v1/admin/reviews/order/status,order",
            "/api/v1/bakery-reviews,order",
            "/api/v1/conversations/conversation/messages,chat",
            "/api/v1/generation-jobs,cake-ai", "/api/v1/generated-designs/design,cake-ai",
            "/api/v1/admin/generated-designs,cake-ai", "/storage/preview/image.png,cake-ai"
    })
    void proxy_publicPath_keepsPathAndRoutesToOwner(String path, String service) throws Exception {
        var response = send(path, "GET");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).startsWith(service + "|GET|" + path + "|");
    }

    @Test
    @DisplayName("Proxy preserves query, auth, idempotency, cookie and JSON body")
    void proxy_postRequest_preservesRequestAndAuthCookiePath() throws Exception {
        String path = "/api/v1/auth/login?page=1&size=20&sort=name%2Casc";
        var response = send(path, "POST");
        assertThat(response.body()).isEqualTo("identity|POST|" + path
                + "|Bearer routing-test|routing-key|refresh_token=fixture|{\"name\":\"cake\"}");
        assertThat(response.headers().firstValue("Set-Cookie"))
                .hasValue("refresh_token=fixture; Path=/api/v1/auth; HttpOnly; SameSite=Lax");
    }

    @DisplayName("Existing service-prefixed URLs still strip exactly one prefix")
    @ParameterizedTest
    @CsvSource({"bakery,bakery,bakeries", "identity,identity,auth/login", "marketplace,marketplace,offers",
            "subscription,subscription,subscription-plans", "orders,order,orders",
            "chat,chat,conversations", "cake-ai,cake-ai,generation-jobs"})
    void proxy_legacyPath_preservesCompatibility(String prefix, String service, String resource) throws Exception {
        var response = send("/" + prefix + "/api/v1/" + resource, "GET");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).startsWith(service + "|GET|/api/v1/" + resource + "|");
        if (service.equals("identity")) {
            assertThat(response.headers().firstValue("Set-Cookie"))
                    .hasValue("refresh_token=fixture; Path=/identity/api/v1/auth; HttpOnly; SameSite=Lax");
        }
    }

    @Test
    @DisplayName("Unmapped resources and internal APIs never reach domain services")
    void proxy_unknownOrInternalPath_doesNotForward() throws Exception {
        int before = calls.get();
        for (String path : new String[]{"/api/v1/unknown", "/internal/v1/users/person"}) {
            assertThat(send(path, "GET").statusCode()).isEqualTo(404);
        }
        assertThat(calls.get()).isEqualTo(before);
    }

    @Test
    @DisplayName("Public review list and legacy alias preserve pagination and sorting")
    void proxy_reviewList_preservesQueryAndAlias() throws Exception {
        String resource = "/api/v1/bakery-reviews?bakeryId=shop&page=2&size=5&sort=createdAt%2Cdesc";
        for (String prefix : new String[]{"", "/orders"}) {
            var response = send(prefix + resource, "GET");
            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.body()).startsWith("order|GET|" + resource + "|");
        }
        assertThat(send("/api/v1/bakery-reviews-unrelated", "GET").statusCode()).isEqualTo(404);
        assertThat(send("/orders/internal/v1/orders/context", "GET").statusCode()).isEqualTo(404);
    }

    private HttpResponse<String> send(String path, String method) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .header("Authorization", "Bearer routing-test").header("Idempotency-Key", "routing-key")
                .header("Cookie", "refresh_token=fixture").header("Content-Type", "application/json")
                .method(method, method.equals("POST") ? HttpRequest.BodyPublishers.ofString("{\"name\":\"cake\"}")
                        : HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
    }

    private static Map<String, HttpServer> startUpstreams() {
        Map<String, HttpServer> servers = new LinkedHashMap<>();
        try {
            for (String name : new String[]{"identity", "bakery", "marketplace", "subscription", "order", "chat", "cake-ai"}) {
                HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
                servers.put(name, server);
                server.createContext("/", exchange -> {
                    calls.incrementAndGet();
                    var headers = exchange.getRequestHeaders();
                    String payload = String.join("|", name, exchange.getRequestMethod(), exchange.getRequestURI().toString(),
                            String.valueOf(headers.getFirst("Authorization")), String.valueOf(headers.getFirst("Idempotency-Key")),
                            String.valueOf(headers.getFirst("Cookie")), new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                    exchange.getResponseHeaders().add("Set-Cookie", "refresh_token=fixture; Path=/api/v1/auth; HttpOnly; SameSite=Lax");
                    byte[] body = payload.getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(200, body.length);
                    try (var output = exchange.getResponseBody()) { output.write(body); }
                });
                server.start();
            }
            return servers;
        } catch (IOException error) {
            servers.values().forEach(server -> server.stop(0));
            throw new IllegalStateException(error);
        }
    }
}
