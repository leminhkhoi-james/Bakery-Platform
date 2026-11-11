package com.se193262.subscriptionservice.feature.payment;

import com.se193262.subscriptionservice.config.VnpayProperties;
import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import com.se193262.subscriptionservice.feature.payment.repository.VnpayAttemptRepository;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.feature.payment.service.impl.VnpayServiceImpl;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.payment.VnpaySigner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VnpayServiceTest {
    @Test
    @DisplayName("Unapproved bakery cannot start a VNPay attempt for an existing order")
    void checkout_unapprovedBakery_rejectsBeforeAttempt() {
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        doThrow(new com.se193262.subscriptionservice.exception.AppException(
                org.springframework.http.HttpStatus.CONFLICT, "Bakery profile must be approved"))
                .when(bakery).requireApprovedBakery(order.getBakeryId());
        assertThatThrownBy(() -> service.checkout(order.getId(), order.getRequestedByUserId(), "127.0.0.1"))
                .hasMessageContaining("must be approved");
        verifyNoInteractions(transactions, attempts, payments);
    }
    @Mock VnpayAttemptRepository attempts;
    @Mock SubscriptionOrderRepository orders;
    @Mock BakeryPaymentService payments;
    @Mock BakeryAccessClient bakery;
    @Mock TransactionTemplate transactions;
    VnpaySigner signer;
    VnpayServiceImpl service;
    SubscriptionOrder order;
    VnpayAttempt attempt;

    @BeforeEach
    void setup() {
        var properties = new VnpayProperties(true, "TESTCODE", "test-secret-only",
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "http://localhost/return", 15);
        signer = new VnpaySigner(properties);
        service = new VnpayServiceImpl(attempts, orders, payments, bakery, transactions, signer, properties);
        var plan = new SubscriptionPlan("PRO", "Pro", new BigDecimal("100000"));
        order = new SubscriptionOrder("SUB-TEST", UUID.randomUUID(), plan, UUID.randomUUID(), Instant.now().plusSeconds(3600));
        ReflectionTestUtils.setField(order, "id", UUID.randomUUID());
        attempt = new VnpayAttempt(order.getId(), order.getRequestedByUserId(), order.getTotalAmount(),
                Instant.now().minusSeconds(60), Instant.now().plusSeconds(600), "127.0.0.1");
    }

    private void transaction() {
        when(transactions.execute(any())).thenAnswer(invocation -> invocation
                .<TransactionCallback<?>>getArgument(0).doInTransaction(new SimpleTransactionStatus()));
    }

    private Map<String, String> callback() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_TmnCode", "TESTCODE");
        fields.put("vnp_TxnRef", attempt.getId().toString().replace("-", ""));
        fields.put("vnp_Amount", "10000000");
        fields.put("vnp_ResponseCode", "00");
        fields.put("vnp_TransactionStatus", "00");
        fields.put("vnp_TransactionNo", "12345678");
        fields.put("vnp_PayDate", DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(Instant.now().atZone(ZoneId.of("Asia/Ho_Chi_Minh"))));
        return signed(fields);
    }

    private Map<String, String> signed(Map<String, String> fields) {
        fields.put("vnp_SecureHash", signer.sign(fields));
        return fields;
    }

    private void existingAttempt() {
        transaction();
        when(attempts.findById(attempt.getId())).thenReturn(Optional.of(attempt));
        when(orders.findLockedById(order.getId())).thenReturn(Optional.of(order));
    }

    @Test @DisplayName("Tampered callbacks cannot read or change payment records")
    void ipn_invalidSignature_rejectsBeforeDatabase() {
        var fields = callback();
        fields.put("vnp_Amount", "1");
        assertThat(service.ipn(fields).get("RspCode")).isEqualTo("97");
        verifyNoInteractions(attempts, orders, payments, transactions, bakery);
    }

    @Test @DisplayName("Signed callbacks for a different merchant are rejected")
    void ipn_wrongMerchant_rejects() {
        var fields = callback();
        fields.put("vnp_TmnCode", "OTHER");
        assertThat(service.ipn(signed(fields)).get("RspCode")).isEqualTo("97");
        verifyNoInteractions(attempts, payments);
    }

    @Test @DisplayName("A signed amount must equal the persisted attempt amount")
    void ipn_wrongAmount_doesNotSettle() {
        existingAttempt();
        var fields = callback();
        fields.put("vnp_Amount", "100");
        assertThat(service.ipn(signed(fields)).get("RspCode")).isEqualTo("04");
        verifyNoInteractions(payments);
        assertThat(attempt.getStatus()).isEqualTo(VnpayAttempt.Status.PENDING);
    }

    @Test @DisplayName("Verified success settles exactly once when IPN is delivered twice")
    void ipn_repeatedSuccess_settlesOnce() {
        existingAttempt();
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        var fields = callback();
        assertThat(service.ipn(fields).get("RspCode")).isEqualTo("00");
        assertThat(service.ipn(fields).get("RspCode")).isEqualTo("02");
        verify(payments).settleVnpay(order.getId(), attempt.getUserId(), "12345678", attempt.getId());
        assertThat(attempt.getStatus()).isEqualTo(VnpayAttempt.Status.SUCCEEDED);
    }

    @Test @DisplayName("A failed transaction does not activate a subscription even if response code is 00")
    void ipn_failedStatus_doesNotSettle() {
        existingAttempt();
        var fields = callback();
        fields.put("vnp_TransactionStatus", "02");
        assertThat(service.ipn(signed(fields)).get("RspCode")).isEqualTo("00");
        assertThat(attempt.getStatus()).isEqualTo(VnpayAttempt.Status.FAILED);
        verifyNoInteractions(payments);
    }

    @Test @DisplayName("A late paid notification for an already completed order is retained for reconciliation")
    void ipn_orderAlreadyCompleted_recordsForReview() {
        existingAttempt();
        order.complete(Instant.now());
        assertThat(service.ipn(callback()).get("RspCode")).isEqualTo("00");
        assertThat(attempt.getStatus()).isEqualTo(VnpayAttempt.Status.REVIEW_REQUIRED);
        assertThat(attempt.getTransactionNo()).isEqualTo("12345678");
        verifyNoInteractions(payments);
    }

    @Test @DisplayName("A delayed IPN can settle an expired order paid within the original checkout window")
    void ipn_expiredOrderWithTimelyPayment_settles() {
        existingAttempt();
        order.expire();
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        assertThat(service.ipn(callback()).get("RspCode")).isEqualTo("00");
        verify(payments).settleVnpay(any(), any(), any(), any());
    }

    @Test @DisplayName("Payments outside the signed checkout window require reconciliation")
    void ipn_payTimeAfterExpiry_doesNotActivate() {
        existingAttempt();
        ReflectionTestUtils.setField(attempt, "expiresAt", Instant.now().minusSeconds(10));
        assertThat(service.ipn(callback()).get("RspCode")).isEqualTo("00");
        assertThat(attempt.getStatus()).isEqualTo(VnpayAttempt.Status.REVIEW_REQUIRED);
        verifyNoInteractions(payments);
    }

    @Test @DisplayName("Browser return settles verified pending callback immediately")
    void returnResult_signedSuccess_settlesPendingAttempt() {
        existingAttempt();
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        assertThat(service.returnResult(callback()).get("status")).isEqualTo("SUCCEEDED");
        verify(payments).settleVnpay(order.getId(), attempt.getUserId(), "12345678", attempt.getId());
    }

    @Test @DisplayName("Retrying checkout reuses its active persisted attempt and checks bakery ownership")
    void checkout_retry_reusesAttempt() {
        transaction();
        when(orders.findById(order.getId())).thenReturn(Optional.of(order));
        when(orders.findLockedById(order.getId())).thenReturn(Optional.of(order));
        when(attempts.findFirstByOrderIdAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(any(), any(), any()))
                .thenReturn(Optional.of(attempt));
        var checkout = service.checkout(order.getId(), attempt.getUserId(), "127.0.0.1");
        assertThat(checkout.attemptId()).isEqualTo(attempt.getId());
        assertThat(checkout.paymentUrl()).contains("vnp_Amount=10000000", "vnp_SecureHash=");
        verify(bakery).requireMember(order.getBakeryId(), attempt.getUserId(), true);
        verify(attempts, never()).saveAndFlush(any());
    }

    @Test @DisplayName("Missing merchant configuration rejects checkout before database access")
    void checkout_disabled_failsClosed() {
        var properties = new VnpayProperties(false, "", "", "", "", 15);
        var disabled = new VnpayServiceImpl(attempts, orders, payments, bakery, transactions,
                new VnpaySigner(properties), properties);
        assertThatThrownBy(() -> disabled.checkout(order.getId(), attempt.getUserId(), "127.0.0.1"))
                .hasMessage("VNPay is not configured");
        verifyNoInteractions(orders, attempts, payments);
    }
}
