package com.se193262.chatservice.infrastructure.storage;

import com.se193262.chatservice.config.StorageProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers(disabledWithoutDocker = true)
class MinioAttachmentStorageTest {
    // Credentials belong solely to this disposable container, never an external account.
    private static final String ACCESS = "audit-only-access", SECRET = "audit-only-secret-for-disposable-storage";
    @Container
    static final GenericContainer<?> MINIO = new GenericContainer<>(DockerImageName.parse("bakery-platform-minio:local"))
            .withEnv("MINIO_ROOT_USER", ACCESS).withEnv("MINIO_ROOT_PASSWORD", SECRET)
            .withCommand("server", "/data")
            .withTmpFs(Map.of("/data", "rw,uid=999,gid=999,mode=0700"))
            .withExposedPorts(9000);

    @Test
    @DisplayName("Public-origin signature downloads exact bytes, enforces private access and expires")
    void signedGet_publicEndpoint_downloadsPrivateBytesAndExpires() throws Exception {
        String endpoint = "http://" + MINIO.getHost() + ":" + MINIO.getMappedPort(9000);
        var properties = new StorageProperties(endpoint, ACCESS, SECRET, "test-attachments",
                Duration.ofSeconds(1), endpoint, "us-east-1");
        var storage = new MinioAttachmentStorage(properties);
        byte[] bytes = new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 1, 2, 3};
        storage.put("synthetic/image.jpg", new ByteArrayInputStream(bytes), bytes.length, "image/jpeg");
        String signed = storage.signedGetUrl("synthetic/image.jpg", Duration.ofSeconds(1));
        var client = HttpClient.newHttpClient();
        var response = client.send(HttpRequest.newBuilder(URI.create(signed)).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
        assertEquals(200, response.statusCode());
        assertArrayEquals(bytes, response.body());
        assertEquals("image/jpeg", response.headers().firstValue("content-type").orElseThrow());
        assertEquals(403, client.send(HttpRequest.newBuilder(URI.create(endpoint +
                "/test-attachments/synthetic/image.jpg")).GET().build(),
                HttpResponse.BodyHandlers.discarding()).statusCode());
        Thread.sleep(2100);
        assertEquals(403, client.send(HttpRequest.newBuilder(URI.create(signed)).GET().build(),
                HttpResponse.BodyHandlers.discarding()).statusCode());
        storage.delete("synthetic/image.jpg");
    }

    @Test
    @DisplayName("Signing an external HTTPS origin does not require external DNS or rewrite the signed Host")
    void signedGet_externalOnlyOrigin_signsWithoutNetworkLookup() {
        var properties = new StorageProperties("http://chat-storage:9000", ACCESS, SECRET,
                "test-attachments", Duration.ofMinutes(15), "https://media.example.invalid:9443", "us-east-1");
        URI signed = URI.create(new MinioAttachmentStorage(properties)
                .signedGetUrl("synthetic/image.jpg", Duration.ofMinutes(15)));
        assertEquals("media.example.invalid", signed.getHost());
        assertEquals("https", signed.getScheme());
        assertEquals(9443, signed.getPort());
        assertTrue(signed.getRawQuery().contains("X-Amz-SignedHeaders=host"));
    }
}
