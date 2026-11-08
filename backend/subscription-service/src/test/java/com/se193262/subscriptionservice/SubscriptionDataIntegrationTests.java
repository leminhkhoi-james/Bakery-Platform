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
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@Transactional
class SubscriptionDataIntegrationTests extends PostgresIntegrationTest {
    @Autowired SubscriptionPlanService planService;
    @Autowired SubscriptionOrderService orderService;
    @Autowired BakeryPaymentService paymentService;
    @Autowired BakerySubscriptionService subscriptionService;
    @MockitoBean BakeryAccessClient bakeryClient;
    @MockitoBean PaymentProofStorage proofStorage;
    @Autowired BakeryPaymentRepository paymentRepository;
    @Autowired SubscriptionOrderRepository orderRepository;
    @Autowired BakerySubscriptionRepository subscriptionRepository;
    @Autowired TransactionTemplate transactions;
    @Autowired JdbcClient jdbc;

    @Test
    @DisplayName("Purchase, payment approval and retries preserve plan snapshots")
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

    @Test
    @DisplayName("Replaying order creation hides another owner's private payment proof")
    void create_replayWithDifferentPaymentSubmitter_hidesProof() {
        UUID bakeryId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        UUID payerId = UUID.randomUUID();
        String key = UUID.randomUUID().toString();
        SubscriptionOrderDto request = planRequest();
        SubscriptionOrderDto created = orderService.create(bakeryId, requesterId, key, request);
        var order = orderRepository.findById(created.id()).orElseThrow();
        paymentRepository.saveAndFlush(new BakeryPayment(order, payerId, "BANK_TRANSFER",
                "PROOF-" + UUID.randomUUID(), null, order.getTotalAmount(), "VND", "private/proof"));
        order.submitPayment();
        orderRepository.flush();
        when(proofStorage.signedUrl("private/proof")).thenReturn("https://test.invalid/signed-proof");

        assertThat(orderService.get(order.getId(), payerId, false).payments().getFirst().proofUrl()).isNotNull();
        assertThat(orderService.get(order.getId(), requesterId, false).payments().getFirst().proofUrl()).isNull();
        assertThat(orderService.create(bakeryId, requesterId, key, request)
                .payments().getFirst().proofUrl()).isNull();
    }

    @Test
    @DisplayName("An overdue payment under review still blocks another subscription purchase")
    void create_overduePaymentReview_returns409() {
        UUID bakeryId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SubscriptionOrderDto request = planRequest();
        var created = orderService.create(bakeryId, userId, UUID.randomUUID().toString(), request);
        var order = orderRepository.findById(created.id()).orElseThrow();
        order.submitPayment();
        orderRepository.flush();
        jdbc.sql("update subscription_orders set created_at=now() - interval '2 days',"
                        + " expires_at=now() - interval '1 minute' where id=:id")
                .param("id", order.getId()).update();

        assertThatThrownBy(() -> orderService.create(bakeryId, userId, UUID.randomUUID().toString(), request))
                .isInstanceOfSatisfying(AppException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("Concurrent subscription operations cannot create a second open order")
    void create_bakeryLocked_returns409ThenRetrySucceeds() throws Exception {
        UUID bakeryId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SubscriptionOrderDto request = planRequest();
        String key = UUID.randomUUID().toString();
        try (var executor = Executors.newSingleThreadExecutor()) {
            transactions.executeWithoutResult(status -> {
                assertThat(subscriptionRepository.tryLockBakery(bakeryId)).isTrue();
                var attempted = executor.submit(() -> {
                    assertThatThrownBy(() -> orderService.create(bakeryId, userId, key, request))
                            .isInstanceOfSatisfying(AppException.class, exception ->
                                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT));
                });
                try {
                    attempted.get(10, TimeUnit.SECONDS);
                } catch (Exception exception) {
                    throw new AssertionError("Concurrent request did not reject the busy bakery", exception);
                }
            });
        }
        var created = orderService.create(bakeryId, userId, key, request);
        assertThat(orderService.create(bakeryId, userId, key, request).id()).isEqualTo(created.id());
        assertThatThrownBy(() -> orderService.create(bakeryId, userId, UUID.randomUUID().toString(), request))
                .isInstanceOf(AppException.class);
        assertThat(orderService.list(bakeryId, userId, false, null, 1, 20, "createdAt,desc")
                .meta().total()).isEqualTo(1);
    }

    private SubscriptionOrderDto planRequest() {
        var plan = planService.create(new SubscriptionPlanDto(null,
                "TEST_" + UUID.randomUUID().toString().substring(0, 8), "Test plan", null,
                BigDecimal.valueOf(100000), "VND", 1, PlanStatus.ACTIVE, Map.of("MAX_PRODUCTS", "10")));
        return new SubscriptionOrderDto(null, null, null, plan.id(), null, null, null,
                null, null, null, null, null, null, null, null);
    }
}
