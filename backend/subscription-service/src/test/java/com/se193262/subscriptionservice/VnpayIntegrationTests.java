package com.se193262.subscriptionservice;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import com.se193262.subscriptionservice.feature.payment.repository.VnpayAttemptRepository;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.feature.payment.service.VnpayService;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.payment.VnpaySigner;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

@TestPropertySource(properties = {"subscription.vnpay.enabled=true", "subscription.vnpay.tmn-code=TESTCODE",
        "subscription.vnpay.hash-secret=test-secret-only", "subscription.vnpay.return-url=http://localhost/return"})
class VnpayIntegrationTests extends PostgresIntegrationTest {
    @Autowired VnpayService vnpay;
    @Autowired VnpaySigner signer;
    @Autowired BakeryPaymentService payments;
    @Autowired VnpayAttemptRepository attempts;
    @Autowired SubscriptionOrderRepository orders;
    @Autowired SubscriptionPlanRepository plans;
    @Autowired TransactionTemplate transactions;
    @Autowired JdbcClient jdbc;
    @MockitoBean BakeryAccessClient bakery;
    @MockitoBean PaymentProofStorage storage;

    private SubscriptionOrder order() {
        return transactions.execute(transaction -> {
            var plan = plans.saveAndFlush(new SubscriptionPlan("TEST-" + UUID.randomUUID(), "Test", new BigDecimal("100000")));
            return orders.saveAndFlush(new SubscriptionOrder("SUB-" + UUID.randomUUID(), UUID.randomUUID(),
                    plan, UUID.randomUUID(), Instant.now().plusSeconds(3600)));
        });
    }

    private Map<String, String> callback(UUID attemptId) {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_TmnCode", "TESTCODE");
        fields.put("vnp_TxnRef", attemptId.toString().replace("-", ""));
        fields.put("vnp_Amount", "10000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TransactionStatus", "00");
        fields.put("vnp_TransactionNo", Long.toString(java.util.concurrent.ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE)));
        fields.put("vnp_PayDate", DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(Instant.now().atZone(ZoneId.of("Asia/Ho_Chi_Minh"))));
        fields.put("vnp_SecureHash", signer.sign(fields));
        return fields;
    }

    @Test @DisplayName("Concurrent verified IPNs commit one payment and one subscription period in PostgreSQL")
    void ipn_concurrentSuccess_createsExactlyOnePeriod() throws Exception {
        var order = order();
        var checkout = vnpay.checkout(order.getId(), order.getRequestedByUserId(), "127.0.0.1");
        var fields = callback(checkout.attemptId());
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> { start.await(); return vnpay.ipn(fields).get("RspCode"); });
            var second = executor.submit(() -> { start.await(); return vnpay.ipn(fields).get("RspCode"); });
            start.countDown();
            assertThat(java.util.List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder("00", "02");
        }
        assertThat(orders.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(SubscriptionOrderStatus.COMPLETED);
        assertThat(attempts.findById(checkout.attemptId()).orElseThrow().getStatus()).isEqualTo(VnpayAttempt.Status.SUCCEEDED);
        assertThat(jdbc.sql("select count(*) from bakery_subscriptions where source_order_id = :id")
                .param("id", order.getId()).query(Long.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("select count(*) from bakery_payments where subscription_order_id = :id and status = 'APPROVED' and verification_source = 'VNPAY' and reviewed_by_admin_id is null")
                .param("id", order.getId()).query(Long.class).single()).isEqualTo(1);
    }

    @Test @DisplayName("Active checkout blocks manual evidence; a failed checkout allows manual submission")
    void submit_activeThenFailedCheckout_preservesManualFallback() {
        var order = order();
        var checkout = vnpay.checkout(order.getId(), order.getRequestedByUserId(), "127.0.0.1");
        var request = new BakeryPaymentDto(null, null, null, "BANK_TRANSFER", "TEST-" + UUID.randomUUID(),
                order.getTotalAmount(), "VND", null, null, null, null, null);
        assertThatThrownBy(() -> payments.submit(order.getId(), order.getRequestedByUserId(), UUID.randomUUID().toString(), request, null))
                .hasMessageContaining("VNPay payment is still in progress");
        var fields = callback(checkout.attemptId());
        fields.put("vnp_ResponseCode", "24");
        fields.put("vnp_TransactionStatus", "02");
        fields.put("vnp_SecureHash", signer.sign(fields));
        assertThat(vnpay.ipn(fields).get("RspCode")).isEqualTo("00");
        payments.submit(order.getId(), order.getRequestedByUserId(), UUID.randomUUID().toString(), request, null);
        assertThat(orders.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(SubscriptionOrderStatus.PAYMENT_REVIEW);
    }

    @Test @DisplayName("A duplicate VNPay transaction number rolls back the other order and period")
    void ipn_transactionReused_rollsBackSettlement() {
        var first = order();
        var second = order();
        var firstCheckout = vnpay.checkout(first.getId(), first.getRequestedByUserId(), "127.0.0.1");
        var secondCheckout = vnpay.checkout(second.getId(), second.getRequestedByUserId(), "127.0.0.1");
        var original = callback(firstCheckout.attemptId());
        assertThat(vnpay.ipn(original).get("RspCode")).isEqualTo("00");
        var duplicate = callback(secondCheckout.attemptId());
        duplicate.put("vnp_TransactionNo", original.get("vnp_TransactionNo"));
        duplicate.put("vnp_SecureHash", signer.sign(duplicate));
        assertThat(vnpay.ipn(duplicate).get("RspCode")).isEqualTo("99");
        assertThat(orders.findById(second.getId()).orElseThrow().getStatus()).isEqualTo(SubscriptionOrderStatus.PENDING_PAYMENT);
        assertThat(jdbc.sql("select count(*) from bakery_subscriptions where source_order_id = :id")
                .param("id", second.getId()).query(Long.class).single()).isZero();
    }
}
