package com.se193262.subscriptionservice.infrastructure.storage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.se193262.subscriptionservice.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import java.io.IOException;
import java.net.ServerSocket;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentProofStorageTest {
    @Test
    void upload_unreachableStorage_isDependencyFailureNotUnreadableProof() throws IOException {
        int port;
        try (var socket = new ServerSocket(0)) { port = socket.getLocalPort(); }
        var storage = new PaymentProofStorage("http://127.0.0.1:" + port, "", "unit-access", "unit-secret", "unit-proofs", "us-east-1");
        var file = new MockMultipartFile("proof", "proof.pdf", "application/pdf", "%PDF-1.4\nlocal-test".getBytes());
        assertThatThrownBy(() -> storage.upload(file, UUID.randomUUID()))
                .isInstanceOfSatisfying(AppException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void upload_unreadableInput_remainsBadRequest() {
        var file = new MockMultipartFile("proof", "proof.pdf", "application/pdf", new byte[]{1}) {
            @Override public byte[] getBytes() throws IOException { throw new IOException("Unreadable input"); }
        };
        var storage = new PaymentProofStorage("", "", "unit-access", "unit-secret", "unit-proofs", "us-east-1");
        assertThatThrownBy(() -> storage.upload(file, UUID.randomUUID()))
                .isInstanceOfSatisfying(AppException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void upload_boundedStorageFullFault_isUnavailableWithoutFillingDisk() throws IOException {
        var server = com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            exchange.getRequestBody().readAllBytes();
            if (exchange.getRequestMethod().equals("HEAD")) {
                exchange.sendResponseHeaders(200, -1);
            } else {
                boolean location = exchange.getRequestURI().getQuery() != null && exchange.getRequestURI().getQuery().contains("location");
                String xml = location ? "<LocationConstraint xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\">us-east-1</LocationConstraint>"
                        : "<Error><Code>XMinioStorageFull</Code><Message>Controlled storage capacity fault</Message><Resource>/unit-proofs</Resource><RequestId>unit</RequestId></Error>";
                byte[] bytes = xml.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/xml");
                exchange.sendResponseHeaders(location ? 200 : 507, bytes.length);
                exchange.getResponseBody().write(bytes);
            }
            exchange.close();
        });
        server.start();
        try {
            var storage = new PaymentProofStorage("http://127.0.0.1:" + server.getAddress().getPort(), "", "unit-access", "unit-secret", "unit-proofs", "us-east-1");
            var file = new MockMultipartFile("proof", "proof.pdf", "application/pdf", "%PDF-1.4\nlocal-test".getBytes());
            assertThatThrownBy(() -> storage.upload(file, UUID.randomUUID()))
                    .isInstanceOfSatisfying(AppException.class,
                            error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        } finally { server.stop(0); }
    }
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
