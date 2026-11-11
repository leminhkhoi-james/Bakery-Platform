package com.se193262.subscriptionservice;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.impl.SubscriptionOrderServiceImpl;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import com.se193262.platform.client.ServiceHttpClient;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.support.TransactionTemplate;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class BakeryApprovalGateTest {
    @Test
    @DisplayName("Only ACTIVE bakery profiles can purchase; unavailable validation fails closed")
    void requireApprovedBakery_nonActiveOrUnavailable_rejectsPurchase() throws Exception {
        UUID bakeryId = UUID.randomUUID();
        AtomicReference<String> response = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/internal/v1/bakeries/", exchange -> {
            byte[] body = response.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            var client = new BakeryAccessClient("http://127.0.0.1:" + server.getAddress().getPort(),
                    "fixture-only", mock(ServiceHttpClient.class));
            for (String status : new String[]{"PENDING_APPROVAL", "DRAFT", "SUSPENDED", "CLOSED"}) {
                response.set("{\"id\":\"" + bakeryId + "\",\"status\":\"" + status + "\"}");
                assertThatThrownBy(() -> client.requireApprovedBakery(bakeryId))
                        .isInstanceOf(AppException.class).hasMessageContaining("must be approved");
            }
            response.set("{\"id\":\"" + bakeryId + "\",\"status\":\"ACTIVE\"}");
            assertThatCode(() -> client.requireApprovedBakery(bakeryId)).doesNotThrowAnyException();
            response.set("{\"id\":\"" + UUID.randomUUID() + "\",\"status\":\"ACTIVE\"}");
            assertThatThrownBy(() -> client.requireApprovedBakery(bakeryId)).hasMessageContaining("Invalid Bakery");
        } finally { server.stop(0); }
    }

    @Test
    @DisplayName("Pending approval blocks order creation before any transaction or persistence")
    void create_pendingBakery_rejectsBeforePersistence() {
        var bakery = mock(BakeryAccessClient.class);
        var transactions = mock(TransactionTemplate.class);
        var orders = mock(SubscriptionOrderRepository.class);
        var service = new SubscriptionOrderServiceImpl(orders, mock(SubscriptionPlanRepository.class),
                mock(BakeryPaymentRepository.class), mock(BakerySubscriptionRepository.class),
                bakery, mock(PaymentProofStorage.class), transactions, 24);
        UUID bakeryId = UUID.randomUUID(), userId = UUID.randomUUID();
        doThrow(new AppException(HttpStatus.CONFLICT, "Bakery profile must be approved"))
                .when(bakery).requireApprovedBakery(bakeryId);
        assertThatThrownBy(() -> service.create(bakeryId, userId, UUID.randomUUID().toString(), null))
                .hasMessageContaining("must be approved");
        verify(bakery).requireMember(bakeryId, userId, true);
        verifyNoInteractions(transactions, orders);
    }
}
