package com.se193262.subscriptionservice.feature.payment;

import com.se193262.subscriptionservice.exception.AppException;
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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

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

@ExtendWith(MockitoExtension.class)
class PaymentReviewTest {
    @Mock BakeryPaymentRepository payments;
    @Mock SubscriptionOrderRepository orders;
    @Mock BakerySubscriptionRepository subscriptions;
    @Mock BakeryAccessClient bakeryClient;
    @Mock PaymentProofStorage proofStorage;
    @InjectMocks BakeryPaymentServiceImpl service;

    @Test
    void approvalCreatesOnePeriodFromOrderSnapshotAndRetryReturnsSamePeriod() {
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
