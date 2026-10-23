package com.se193262.bakeryservice.infrastructure.storage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BakeryImageStorageTest {
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
