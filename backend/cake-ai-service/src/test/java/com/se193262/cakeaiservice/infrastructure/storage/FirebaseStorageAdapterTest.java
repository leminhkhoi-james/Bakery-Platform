package com.se193262.cakeaiservice.infrastructure.storage;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.google.cloud.storage.*;
import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.platform.exception.BusinessException;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Duration;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

class FirebaseStorageAdapterTest {
    Storage client;
    FirebaseStorageAdapter adapter;
    byte[] bytes;
    @BeforeEach void prepare() throws Exception {
        client = mock(Storage.class);
        adapter = new FirebaseStorageAdapter(properties("test-project", "private-bucket"));
        ReflectionTestUtils.setField(adapter, "storage", client);
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB), "png", output);
        bytes = output.toByteArray();
    }

    CakeAiProperties properties(String project, String bucket) {
        return new CakeAiProperties("", "", "", "", Duration.ofSeconds(1), Duration.ofSeconds(1),
                2, Duration.ofMinutes(30), project, bucket, "http://localhost:8085");
    }

    @Test @DisplayName("Signed URLs use V4 with a fifteen minute TTL")
    void signedUrl_validObject_usesShortLivedV4() throws Exception {
        var generator = java.security.KeyPairGenerator.getInstance("RSA"); generator.initialize(2048);
        var credentials = com.google.auth.oauth2.ServiceAccountCredentials.newBuilder()
                .setClientEmail("signer@test-project.iam.gserviceaccount.com")
                .setPrivateKey(generator.generateKeyPair().getPrivate()).setPrivateKeyId("test-key").build();
        ReflectionTestUtils.setField(adapter, "storage", StorageOptions.newBuilder()
                .setProjectId("test-project").setCredentials(credentials).build().getService());
        String url = adapter.signedUrl("cake-ai/designs/image");
        assertTrue(url.contains("X-Goog-Algorithm=GOOG4-RSA-SHA256"));
        assertTrue(url.contains("X-Goog-Expires=900"));
        assertTrue(url.contains("/private-bucket/cake-ai/designs/image"));
    }

    @Test @DisplayName("Upload validates MIME and verifies bytes by reading durable cloud storage")
    void upload_validImage_verifiesDurability() {
        when(client.readAllBytes("private-bucket", "cake-ai/sources/image")).thenReturn(bytes);
        adapter.upload("cake-ai/sources/image", bytes, "image/png");
        var metadata = ArgumentCaptor.forClass(BlobInfo.class);
        verify(client).create(metadata.capture(), eq(bytes), any(Storage.BlobTargetOption.class));
        assertEquals("image/png", metadata.getValue().getContentType());
        assertEquals(64, metadata.getValue().getMetadata().get("sha256").length());
        verify(client).readAllBytes("private-bucket", "cake-ai/sources/image");
    }

    @Test @DisplayName("Failed upload never becomes RAM-backed success")
    void upload_cloudFailure_propagates() {
        when(client.create(any(BlobInfo.class), any(byte[].class), any(Storage.BlobTargetOption.class)))
                .thenThrow(new StorageException(503, "private details"));
        assertEquals(503, assertThrows(StorageFailureException.class,
                () -> adapter.upload("cake-ai/sources/image", bytes, "image/png")).status());
        verify(client, never()).readAllBytes(anyString(), anyString());
    }

    @Test @DisplayName("Readback mismatch prevents publishing durable success")
    void upload_corruptReadback_fails() {
        when(client.readAllBytes("private-bucket", "key")).thenReturn(new byte[]{0});
        assertThrows(StorageFailureException.class, () -> adapter.upload("key", bytes, "image/png"));
    }

    @Test @DisplayName("Corrupt content and MIME mismatch fail before a cloud write")
    void upload_invalidBytes_rejects() {
        assertEquals(422, assertThrows(BusinessException.class, () -> adapter.upload("key", bytes, "image/jpeg")).status());
        assertThrows(BusinessException.class, () -> adapter.upload("key", new byte[]{1, 2}, "image/png"));
        verifyNoInteractions(client);
    }

    @Test @DisplayName("Missing bucket or ADC fails closed instead of using RAM")
    void storage_missingConfiguration_fails() {
        var missing = new FirebaseStorageAdapter(properties("", ""));
        assertThrows(StorageFailureException.class, missing::checkAvailable);
        assertThrows(StorageFailureException.class, () -> missing.upload("key", bytes, "image/png"));
        try (var credentials = mockStatic(com.google.auth.oauth2.GoogleCredentials.class)) {
            credentials.when(com.google.auth.oauth2.GoogleCredentials::getApplicationDefault)
                    .thenThrow(new java.io.IOException("private path"));
            assertThrows(StorageFailureException.class,
                    () -> new FirebaseStorageAdapter(properties("project", "bucket")).checkAvailable());
        }
    }

    @Test @DisplayName("Cloud read failures remain failures even after an earlier upload")
    void read_remoteFailure_hasNoMemoryFallback() {
        when(client.readAllBytes("private-bucket", "key")).thenReturn(bytes);
        adapter.upload("key", bytes, "image/png");
        when(client.readAllBytes("private-bucket", "key")).thenThrow(new StorageException(503, "private"));
        assertThrows(StorageFailureException.class, () -> adapter.read("key"));
        doThrow(new StorageException(404, "private")).when(client).readAllBytes("private-bucket", "key");
        assertEquals(404, assertThrows(BusinessException.class, () -> adapter.read("key")).status());
    }

    @Test @DisplayName("Signing and deletion errors are sanitized failures")
    void signedUrl_signerFailure_returnsUnavailable() {
        when(client.signUrl(any(), anyLong(), any(), any(Storage.SignUrlOption.class)))
                .thenThrow(new IllegalStateException("private details"));
        BusinessException error = assertThrows(BusinessException.class, () -> adapter.signedUrl("key"));
        assertEquals(503, error.status()); assertFalse(error.getMessage().contains("private details"));
        when(client.delete(eq("private-bucket"), eq("key"))).thenThrow(new StorageException(503, "private"));
        assertThrows(StorageFailureException.class, () -> adapter.delete("key"));
    }
}
