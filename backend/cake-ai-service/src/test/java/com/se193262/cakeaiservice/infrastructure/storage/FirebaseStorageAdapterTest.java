package com.se193262.cakeaiservice.infrastructure.storage;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.google.cloud.storage.*;
import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.platform.exception.BusinessException;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Duration;

class FirebaseStorageAdapterTest {
    Storage client;
    FirebaseStorageAdapter adapter;
    @BeforeEach void prepare() {
        client = mock(Storage.class);
        adapter = new FirebaseStorageAdapter(new CakeAiProperties("", "", "", "", Duration.ofSeconds(1),
                Duration.ofSeconds(1), 2, Duration.ofMinutes(30), "test-project", "private-bucket"));
        ReflectionTestUtils.setField(adapter, "storage", client);
    }

    @Test @DisplayName("Signed URLs use V4 with a fifteen minute TTL")
    void signedUrl_validObject_usesShortLivedV4() throws Exception {
        var generator = java.security.KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
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

    @Test @DisplayName("Upload stores private object metadata and refuses overwrites")
    void upload_validImage_storesContentType() {
        byte[] bytes = {1, 2, 3};
        adapter.upload("cake-ai/sources/image", bytes, "image/png");
        verify(client).create(BlobInfo.newBuilder("private-bucket", "cake-ai/sources/image")
                .setContentType("image/png").build(), bytes, Storage.BlobTargetOption.doesNotExist());
    }

    @Test @DisplayName("Signing failures return a safe unavailable error")
    void signedUrl_signerFailure_returnsUnavailable() {
        when(client.signUrl(any(), anyLong(), any(), any(Storage.SignUrlOption.class))).thenThrow(new IllegalStateException("private details"));
        BusinessException error = assertThrows(BusinessException.class, () -> adapter.signedUrl("cake-ai/designs/image"));
        assertEquals(503, error.status());
        assertFalse(error.getMessage().contains("private details"));
    }
}
