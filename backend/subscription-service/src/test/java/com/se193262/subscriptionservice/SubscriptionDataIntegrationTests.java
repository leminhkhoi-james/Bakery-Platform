package com.se193262.subscriptionservice;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.feature.plan.dto.SubscriptionPlanDto;
import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.service.SubscriptionPlanService;
import com.se193262.subscriptionservice.feature.subscription.service.BakerySubscriptionService;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class SubscriptionDataIntegrationTests {
    @Autowired SubscriptionPlanService planService;
    @Autowired SubscriptionOrderService orderService;
    @Autowired BakeryPaymentService paymentService;
    @Autowired BakerySubscriptionService subscriptionService;

    @Test
    void createsPlanOrderAndReferencePaymentWithoutDuplicateRetry() {
        SubscriptionPlanDto plan = planService.create(new SubscriptionPlanDto(null, "TEST_" +
                UUID.randomUUID().toString().substring(0, 8), "Test plan", null,
                BigDecimal.valueOf(100000), "VND", 2, PlanStatus.ACTIVE,
                Map.of("MAX_PRODUCTS", "10")));
        assertThat(plan.features()).containsEntry("MAX_PRODUCTS", "10");
        assertThat(planService.getPublic(plan.id()).id()).isEqualTo(plan.id());

        UUID bakeryId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SubscriptionOrderDto request = new SubscriptionOrderDto(null, null, null, plan.id(),
                null, null, null, null, null, null, null, null, null, null, null);
        SubscriptionOrderDto order = orderService.create(bakeryId, userId, "order-key", request);
        assertThat(order.totalAmount()).isEqualByComparingTo("200000");
        assertThat(order.status()).isEqualTo(SubscriptionOrderStatus.PENDING_PAYMENT);
        assertThat(orderService.create(bakeryId, userId, "order-key", request).id()).isEqualTo(order.id());
        assertThatThrownBy(() -> orderService.create(bakeryId, userId, "another-key", request))
                .isInstanceOf(AppException.class);
        assertThat(orderService.list(bakeryId, SubscriptionOrderStatus.PENDING_PAYMENT, 1, 20)
                .meta().total()).isEqualTo(1);

        planService.update(plan.id(), new SubscriptionPlanDto(null, null, "Updated plan", null,
                BigDecimal.valueOf(250000), null, null, null, Map.of("MAX_PRODUCTS", "20")));
        assertThat(orderService.get(order.id()).planNameSnapshot()).isEqualTo("Test plan");
        assertThat(orderService.get(order.id()).totalAmount()).isEqualByComparingTo("200000");
        assertThatThrownBy(() -> planService.update(plan.id(), new SubscriptionPlanDto(null,
                "CHANGED", null, null, null, null, null, null, null)))
                .isInstanceOf(AppException.class);

        BakeryPaymentDto paymentRequest = new BakeryPaymentDto(null, null, null,
                "BANK_TRANSFER", "TEST-" + UUID.randomUUID(), order.totalAmount(),
                "VND", null, null, null, null, null);
        BakeryPaymentDto payment = paymentService.submit(order.id(), userId,
                "payment-key", paymentRequest, false);
        assertThat(payment.status()).isEqualTo(PaymentStatus.SUBMITTED);
        assertThat(paymentService.submit(order.id(), userId,
                "payment-key", paymentRequest, false).id()).isEqualTo(payment.id());
        assertThat(orderService.get(order.id()).status()).isEqualTo(SubscriptionOrderStatus.PAYMENT_REVIEW);
        assertThat(orderService.get(order.id()).payments()).hasSize(1);
        assertThat(paymentService.listForReview(PaymentStatus.SUBMITTED, bakeryId,
                null, null, 1, 20).result()).extracting(BakeryPaymentDto::id)
                .containsExactly(payment.id());
        assertThat(subscriptionService.getForBakery(bakeryId).currentSubscription()).isNull();

        SubscriptionPlanDto archived = planService.archive(plan.id());
        assertThat(archived.status()).isEqualTo(PlanStatus.ARCHIVED);
        assertThatThrownBy(() -> planService.getPublic(plan.id())).isInstanceOf(AppException.class);
    }
}
