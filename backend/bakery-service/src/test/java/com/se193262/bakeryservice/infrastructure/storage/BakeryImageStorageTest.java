package com.se193262.bakeryservice.infrastructure.storage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.se193262.bakeryservice.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.net.ServerSocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BakeryImageStorageTest {
    private BakeryImageStorage storage(String endpoint) {
        return new BakeryImageStorage(endpoint, endpoint, "test-access", "test-secret", "bakery-media", "us-east-1");
    }

    @Test
    void upload_validPngAndUnreachableStorage_returnsDependencyFailure() throws IOException {
        int port;
        try (var socket = new ServerSocket(0)) { port = socket.getLocalPort(); }
        byte[] png = java.util.Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=");
        assertThatThrownBy(() -> storage("http://127.0.0.1:" + port)
                .upload(new MockMultipartFile("file", "valid.png", "image/png", png), "test"))
                .isInstanceOfSatisfying(AppException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void upload_corruptUnsupportedOrOversizedInput_returnsBadRequestBeforeStorage() {
        for (var file : java.util.List.of(
                new MockMultipartFile("file", "corrupt.png", "image/png", new byte[]{1,2,3}),
                new MockMultipartFile("file", "text.txt", "text/plain", "text".getBytes()),
                new MockMultipartFile("file", "large.png", "image/png", new byte[5 * 1024 * 1024 + 1]))) {
            assertThatThrownBy(() -> storage("").upload(file, "test"))
                    .isInstanceOfSatisfying(AppException.class,
                            error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        }
    }

    @Test
    void upload_unreadableMultipartInput_returnsBadRequest() {
        var file = new MockMultipartFile("file", "valid.png", "image/png", new byte[]{1}) {
            @Override public byte[] getBytes() throws IOException { throw new IOException("Input unavailable"); }
        };
        assertThatThrownBy(() -> storage("").upload(file, "test"))
                .isInstanceOfSatisfying(AppException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("Sign public media URLs without contacting the public endpoint from Docker")
    void signedUrl_publicEndpoint_generatesOffline() {
        BakeryImageStorage storage = new BakeryImageStorage("http://bakery-storage:9000",
                "http://localhost:9002", "test-access", "test-secret", "bakery-media", "us-east-1");

        assertThat(storage.signedUrl("products/example.png"))
                .startsWith("http://localhost:9002/bakery-media/products/example.png?")
                .contains("X-Amz-Signature=", "us-east-1");
    }
}
