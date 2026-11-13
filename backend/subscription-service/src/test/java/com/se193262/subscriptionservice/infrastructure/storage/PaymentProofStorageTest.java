package com.se193262.subscriptionservice.infrastructure.storage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentProofStorageTest {
    @Test
    @DisplayName("Sign public proof URLs without contacting the public endpoint from Docker")
    void signedUrl_publicEndpoint_generatesOffline() {
        PaymentProofStorage storage = new PaymentProofStorage("http://subscription-storage:9000",
                "http://localhost:9004", "test-access", "test-secret", "subscription-proofs", "us-east-1");

        assertThat(storage.signedUrl("payments/example.pdf"))
                .startsWith("http://localhost:9004/subscription-proofs/payments/example.pdf?")
                .contains("X-Amz-Signature=", "us-east-1");
    }
}
