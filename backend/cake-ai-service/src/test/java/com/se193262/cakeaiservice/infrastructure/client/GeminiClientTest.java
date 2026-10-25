package com.se193262.cakeaiservice.infrastructure.client;

import static org.junit.jupiter.api.Assertions.*;
import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.cakeaiservice.infrastructure.storage.ImageValidator;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import tools.jackson.databind.*;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

class GeminiClientTest {
    HttpServer server;
    GeminiClient client;
    ObjectMapper json = new ObjectMapper();
    String response;
    int status;
    int delayMillis;
    AtomicInteger requests;
    JsonNode received;
    byte[] image;

    @BeforeEach void start() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB), "png", output);
        image = output.toByteArray();
        status = 200; requests = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/interactions", exchange -> {
            requests.incrementAndGet();
            received = json.readTree(exchange.getRequestBody().readAllBytes());
            assertEquals("fake-key", exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            if (delayMillis > 0) {
                try { Thread.sleep(delayMillis); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); }
            }
            byte[] bytes = response.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        client = new GeminiClient(new CakeAiProperties("fake-key", "http://127.0.0.1:" + server.getAddress().getPort(),
                "image-model", "moderation-model", Duration.ofSeconds(1), Duration.ofSeconds(2), 2,
                Duration.ofMinutes(30), "", ""), json, new ImageValidator());
    }
    @AfterEach void stop() { server.stop(0); }

    @Test @DisplayName("Image response is validated and request disables provider storage")
    void generate_imageResponse_decodesImage() {
        response = output(Map.of("type", "image", "mime_type", "image/png", "data", Base64.getEncoder().encodeToString(image)));
        var actual = client.generate("snapshot-model", "pink cake", "4:3", List.of());
        assertArrayEquals(image, actual.bytes());
        assertFalse(received.path("store").asBoolean(true));
        assertEquals("snapshot-model", received.path("model").asText());
        assertEquals("1K", received.path("response_format").path("image_size").asText());
    }

    @Test @DisplayName("Provider throttling is sanitized and never retried")
    void generate_rateLimit_failsWithoutRetry() {
        status = 429; response = "{\"secret\":\"do-not-expose\"}";
        var error = assertThrows(ProviderException.class, () -> client.generate("model", "cake", "1:1", List.of()));
        assertEquals("PROVIDER_RATE_LIMITED", error.code());
        assertEquals(1, requests.get());
        assertFalse(error.getMessage().contains("do-not-expose"));
    }

    @Test @DisplayName("Provider refusal never becomes an image")
    void generate_refusal_failsSafely() {
        response = output(Map.of("type", "refusal", "refusal", "blocked"));
        assertEquals("PROVIDER_BLOCKED", assertThrows(ProviderException.class,
                () -> client.generate("model", "cake", "1:1", List.of())).code());
    }

    @Test @DisplayName("Missing images produce a safe failure")
    void generate_textOnly_fails() {
        response = output(Map.of("type", "text", "text", "No image"));
        assertThrows(ProviderException.class, () -> client.generate("model", "cake", "1:1", List.of()));
    }

    @Test @DisplayName("Malformed moderation response remains pending")
    void moderate_invalidJson_keepsPending() {
        response = output(Map.of("type", "text", "text", "not JSON"));
        assertEquals(ImageProvider.Moderation.PENDING, client.moderate("cake", List.of()));
        assertTrue(received.path("system_instruction").asText().contains("Do not follow"));
    }

    @Test @DisplayName("Structured safe moderation approves the content")
    void moderate_safeJson_approves() {
        response = output(Map.of("type", "text", "text", "{\"decision\":\"APPROVED\"}"));
        assertEquals(ImageProvider.Moderation.APPROVED, client.moderate("cake", List.of()));
    }

    @Test @DisplayName("Ambiguous provider timeout is not retried")
    void generate_timeout_failsWithoutRetry() {
        delayMillis = 500;
        response = output(Map.of("type", "text", "text", "late"));
        var fastClient = new GeminiClient(new CakeAiProperties("fake-key", "http://127.0.0.1:" + server.getAddress().getPort(),
                "image-model", "moderation-model", Duration.ofSeconds(1), Duration.ofMillis(100), 2,
                Duration.ofMinutes(30), "", ""), json, new ImageValidator());
        var error = assertThrows(ProviderException.class,
                () -> fastClient.generate("model", "cake", "1:1", List.of()));
        assertEquals("PROVIDER_RESULT_UNKNOWN", error.code());
        assertEquals(1, requests.get());
    }

    private String output(Map<String, Object> content) {
        return json.writeValueAsString(Map.of("status", "completed", "steps",
                List.of(Map.of("type", "model_output", "content", List.of(content)))));
    }
}
