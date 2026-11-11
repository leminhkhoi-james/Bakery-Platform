package com.se193262.subscriptionservice.feature.payment;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.payment.service.impl.BakeryPaymentServiceImpl;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class PaymentReviewTest {
    @Test
    @DisplayName("Unapproved bakery cannot upload or submit manual payment evidence")
    void submit_unapprovedBakery_rejectsBeforeUpload() {
        UUID orderId = UUID.randomUUID(), userId = UUID.randomUUID();
        var plan = new SubscriptionPlan("BASIC", "Basic", BigDecimal.TEN);
        var order = new SubscriptionOrder("SUB-PENDING", UUID.randomUUID(), plan, userId,
                Instant.now().plusSeconds(3600));
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        org.mockito.Mockito.doThrow(new AppException(HttpStatus.CONFLICT, "Bakery profile must be approved"))
                .when(bakeryClient).requireApprovedBakery(order.getBakeryId());
        var request = new BakeryPaymentDto(null, null, null, "BANK_TRANSFER", "FT-TEST",
                BigDecimal.TEN, "VND", null, null, null, null, null);
        assertThatThrownBy(() -> service.submit(orderId, userId, UUID.randomUUID().toString(), request, null))
                .hasMessageContaining("must be approved");
        verifyNoInteractions(transactions, payments, proofStorage);
    }
    @Mock BakeryPaymentRepository payments;
    @Mock SubscriptionOrderRepository orders;
    @Mock BakerySubscriptionRepository subscriptions;
    @Mock BakeryAccessClient bakeryClient;
    @Mock PaymentProofStorage proofStorage;
    @Mock TransactionTemplate transactions;
    @Mock com.se193262.subscriptionservice.feature.payment.repository.VnpayAttemptRepository attempts;
    @InjectMocks BakeryPaymentServiceImpl service;

    @Test
    @DisplayName("A manual reference submits for review without a sandbox code or proof")
    void submit_manualReference_waitsForAdminReview() {
        when(transactions.execute(any())).thenAnswer(invocation ->
                invocation.<TransactionCallback<?>>getArgument(0).doInTransaction(new SimpleTransactionStatus()));
        SubscriptionPlan plan = new SubscriptionPlan("BASIC", "Basic", BigDecimal.TEN);
        UUID userId = UUID.randomUUID();
        SubscriptionOrder order = new SubscriptionOrder("SUB-MANUAL", UUID.randomUUID(), plan,
                userId, Instant.now().plusSeconds(3600));
        UUID orderId = UUID.randomUUID();
        ReflectionTestUtils.setField(order, "id", orderId);
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(orders.findLockedById(orderId)).thenReturn(Optional.of(order));
        when(payments.saveAndFlush(any(BakeryPayment.class))).thenAnswer(invocation -> {
            BakeryPayment payment = invocation.getArgument(0);
            ReflectionTestUtils.setField(payment, "id", UUID.randomUUID());
            return payment;
        });
        BakeryPaymentDto request = new BakeryPaymentDto(null, null, null, "BANK_TRANSFER",
                "DEMO-" + orderId, order.getTotalAmount(), "VND", null, null, null, null, null);

        var result = service.submit(orderId, userId, UUID.randomUUID().toString(), request, null);

        assertThat(result.paymentReference()).isEqualTo(request.paymentReference());
        assertThat(result.status()).isEqualTo(PaymentStatus.SUBMITTED);
        assertThat(order.getStatus()).isEqualTo(SubscriptionOrderStatus.PAYMENT_REVIEW);
        assertThat(service.isSandboxEnabled()).isFalse();
        verify(bakeryClient).requireMember(order.getBakeryId(), userId, true);
        verifyNoInteractions(subscriptions);
        verify(proofStorage, never()).upload(any(), any());
    }

    @Test
    @DisplayName("Missing evidence and the retired sandbox method cannot submit a payment")
    void submit_missingEvidenceOrSandbox_rejectsBeforePersistence() {
        for (String method : List.of("BANK_TRANSFER", "SANDBOX", "sandbox")) {
            BakeryPaymentDto request = new BakeryPaymentDto(null, null, null, method,
                    method.equals("BANK_TRANSFER") ? null : "BAKERY-TEST",
                    BigDecimal.TEN, "VND", null, null, null, null, null);
            assertThatThrownBy(() -> service.submit(UUID.randomUUID(), UUID.randomUUID(),
                    UUID.randomUUID().toString(), request, null))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining(method.equals("BANK_TRANSFER")
                            ? "Payment reference or proof is required" : "Sandbox payments are not supported");
        }
        verifyNoInteractions(payments, orders, subscriptions, bakeryClient, proofStorage, transactions);
    }

    @Test
    void approvalCreatesOnePeriodFromOrderSnapshotAndRetryReturnsSamePeriod() {
        when(transactions.execute(any())).thenAnswer(invocation ->
                invocation.<TransactionCallback<?>>getArgument(0).doInTransaction(new SimpleTransactionStatus()));
        SubscriptionPlan plan = new SubscriptionPlan("PRO", "Pro", BigDecimal.valueOf(100));
        plan.update(null, null, null, null, null, 1, null, Map.of("MAX_PRODUCTS", "10"));
        SubscriptionOrder order = new SubscriptionOrder("SUB-1", UUID.randomUUID(), plan,
                UUID.randomUUID(), Instant.now().plusSeconds(3600));
        ReflectionTestUtils.setField(order, "id", UUID.randomUUID());
        BakeryPayment payment = new BakeryPayment(order, UUID.randomUUID(), "BANK_TRANSFER",
                "BANK-1", "submit-hash", order.getTotalAmount(), "VND", null);
        ReflectionTestUtils.setField(payment, "id", UUID.randomUUID());
        order.submitPayment();
        when(payments.findById(payment.getId())).thenReturn(Optional.of(payment));
        AtomicReference<BakerySubscription> saved = new AtomicReference<>();
        when(subscriptions.findBySourceOrder_Id(order.getId()))
                .thenAnswer(call -> Optional.ofNullable(saved.get()));
        when(subscriptions.findAllByBakeryIdOrderByPeriodStartDesc(order.getBakeryId()))
                .thenReturn(List.of());
        when(subscriptions.tryLockBakery(order.getBakeryId())).thenReturn(true);
        when(subscriptions.saveAndFlush(any(BakerySubscription.class))).thenAnswer(call -> {
            BakerySubscription period = call.getArgument(0);
            ReflectionTestUtils.setField(period, "id", UUID.randomUUID());
            saved.set(period);
            return period;
        });
        UUID adminId = UUID.randomUUID();
        String key = UUID.randomUUID().toString();
        var result = service.approve(payment.getId(), adminId, key, "matched");
        assertThat(result.payment().status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(result.order().status()).isEqualTo(SubscriptionOrderStatus.COMPLETED);
        assertThat(result.subscription().status()).isEqualTo(SubscriptionStatus.ACTIVE);
        assertThat(saved.get().getFeaturesSnapshot()).containsEntry("MAX_PRODUCTS", "10");

        plan.update(null, null, null, null, null, null, null, Map.of("MAX_PRODUCTS", "20"));
        assertThat(saved.get().getFeaturesSnapshot()).containsEntry("MAX_PRODUCTS", "10");
        assertThat(service.approve(payment.getId(), adminId, key, "matched")
                .subscription().id()).isEqualTo(saved.get().getId());
        assertThatThrownBy(() -> service.approve(payment.getId(), adminId,
                UUID.randomUUID().toString(), "matched")).isInstanceOf(AppException.class);
        verify(bakeryClient, times(2)).notifySubscriptionApproved(order.getBakeryId());
    }

    @Test
    void rejectionReopensUnexpiredOrderAndRequiresNote() {
        SubscriptionPlan plan = new SubscriptionPlan("BASIC", "Basic", BigDecimal.TEN);
        SubscriptionOrder order = new SubscriptionOrder("SUB-2", UUID.randomUUID(), plan,
                UUID.randomUUID(), Instant.now().plusSeconds(3600));
        BakeryPayment payment = new BakeryPayment(order, UUID.randomUUID(), "BANK_TRANSFER",
                "BANK-2", "submit-hash", order.getTotalAmount(), "VND", null);
        ReflectionTestUtils.setField(payment, "id", UUID.randomUUID());
        order.submitPayment();
        when(payments.findById(payment.getId())).thenReturn(Optional.of(payment));
        assertThatThrownBy(() -> service.reject(payment.getId(), UUID.randomUUID(), " "))
                .isInstanceOf(AppException.class);
        var result = service.reject(payment.getId(), UUID.randomUUID(), "wrong transfer");
        assertThat(result.payment().status()).isEqualTo(PaymentStatus.REJECTED);
        assertThat(result.order().status()).isEqualTo(SubscriptionOrderStatus.PENDING_PAYMENT);
    }
}
