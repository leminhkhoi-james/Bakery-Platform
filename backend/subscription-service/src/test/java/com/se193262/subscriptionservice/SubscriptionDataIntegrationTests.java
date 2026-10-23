package com.se193262.subscriptionservice;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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
    @MockitoBean BakeryAccessClient bakeryClient;

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
        String orderKey = UUID.randomUUID().toString();
        SubscriptionOrderDto order = orderService.create(bakeryId, userId, orderKey, request);
        assertThat(order.totalAmount()).isEqualByComparingTo("200000");
        assertThat(order.status()).isEqualTo(SubscriptionOrderStatus.PENDING_PAYMENT);
        assertThat(orderService.create(bakeryId, userId, orderKey, request).id()).isEqualTo(order.id());
        assertThatThrownBy(() -> orderService.create(bakeryId, userId,
                UUID.randomUUID().toString(), request))
                .isInstanceOf(AppException.class);
        assertThat(orderService.list(bakeryId, userId, false, SubscriptionOrderStatus.PENDING_PAYMENT,
                1, 20, "createdAt,desc")
                .meta().total()).isEqualTo(1);

        planService.update(plan.id(), new SubscriptionPlanDto(null, null, "Updated plan", null,
                BigDecimal.valueOf(250000), null, null, null, Map.of("MAX_PRODUCTS", "20")));
        assertThat(orderService.get(order.id(), userId, false).planNameSnapshot()).isEqualTo("Test plan");
        assertThat(orderService.get(order.id(), userId, false).totalAmount()).isEqualByComparingTo("200000");
        assertThatThrownBy(() -> planService.update(plan.id(), new SubscriptionPlanDto(null,
                "CHANGED", null, null, null, null, null, null, null)))
                .isInstanceOf(AppException.class);

        BakeryPaymentDto paymentRequest = new BakeryPaymentDto(null, null, null,
                "BANK_TRANSFER", "TEST-" + UUID.randomUUID(), order.totalAmount(),
                "VND", null, null, null, null, null);
        String paymentKey = UUID.randomUUID().toString();
        BakeryPaymentDto payment = paymentService.submit(order.id(), userId,
                paymentKey, paymentRequest, null);
        assertThat(payment.status()).isEqualTo(PaymentStatus.SUBMITTED);
        assertThat(paymentService.submit(order.id(), userId,
                paymentKey, paymentRequest, null).id()).isEqualTo(payment.id());
        assertThat(orderService.get(order.id(), userId, false).status())
                .isEqualTo(SubscriptionOrderStatus.PAYMENT_REVIEW);
        assertThat(orderService.get(order.id(), userId, false).payments()).hasSize(1);
        assertThat(paymentService.listForReview(PaymentStatus.SUBMITTED, bakeryId,
                null, null, 1, 20, "submittedAt,asc").result()).extracting(BakeryPaymentDto::id)
                .containsExactly(payment.id());
        assertThat(subscriptionService.getForBakery(bakeryId).currentSubscription()).isNull();

        UUID adminId = UUID.randomUUID();
        String approvalKey = UUID.randomUUID().toString();
        var approved = paymentService.approve(payment.id(), adminId, approvalKey, "Matched statement");
        assertThat(approved.payment().status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(approved.order().status()).isEqualTo(SubscriptionOrderStatus.COMPLETED);
        assertThat(approved.subscription().status()).isEqualTo(SubscriptionStatus.ACTIVE);
        assertThat(paymentService.approve(payment.id(), adminId, approvalKey, "Matched statement")
                .subscription().id()).isEqualTo(approved.subscription().id());
        assertThat(subscriptionService.entitlement(bakeryId).features())
                .containsEntry("MAX_PRODUCTS", "10");

        SubscriptionPlanDto archived = planService.archive(plan.id());
        assertThat(archived.status()).isEqualTo(PlanStatus.ARCHIVED);
        assertThatThrownBy(() -> planService.getPublic(plan.id())).isInstanceOf(AppException.class);
    }
}
