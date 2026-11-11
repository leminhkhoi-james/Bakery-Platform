package com.se193262.subscriptionservice;

import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.AdminSubscriptionOrderFilter;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@Transactional
class AdminSubscriptionOrderIntegrationTests extends PostgresIntegrationTest {
    @Autowired SubscriptionOrderService service;
    @Autowired SubscriptionOrderRepository orders;
    @Autowired SubscriptionPlanRepository plans;
    @Autowired BakeryPaymentRepository payments;
    @MockitoBean BakeryAccessClient bakery;
    @MockitoBean PaymentProofStorage storage;

    private SubscriptionOrder order(String name) {
        var plan = plans.saveAndFlush(new SubscriptionPlan("ADMIN-" + UUID.randomUUID(), name, new BigDecimal("499000")));
        return orders.saveAndFlush(new SubscriptionOrder("SUB-" + UUID.randomUUID(), UUID.randomUUID(), plan,
                UUID.randomUUID(), Instant.now().plusSeconds(3600)));
    }

    private void payment(SubscriptionOrder order, String method, String amount, String currency) {
        order.submitPayment();
        payments.saveAndFlush(new BakeryPayment(order, order.getRequestedByUserId(), method,
                "TEST-" + UUID.randomUUID(), null, new BigDecimal(amount), currency, null));
        orders.flush();
    }

    private AdminSubscriptionOrderFilter filter(SubscriptionOrderStatus status, String query, Boolean eligible, int page, int size) {
        return new AdminSubscriptionOrderFilter(status, null, query, null, null, eligible, page, size);
    }

    @Test @DisplayName("Admin directory includes unpaid 499k orders and only marks matching submitted manual payments eligible")
    void listAdmin_allStates_distinguishesApprovalEligibility() {
        var pending = order("Pending 499k");
        var ready = order("Ready 499k");
        payment(ready, "BANK_TRANSFER", "499000", "VND");
        var mismatch = order("Mismatch");
        payment(mismatch, "BANK_TRANSFER", "498000", "VND");
        var completed = order("Completed");
        completed.complete(Instant.now());
        orders.flush();

        var all = service.listAdmin(filter(null, null, null, 1, 20));
        assertThat(all.meta().total()).isEqualTo(4);
        var unpaid = all.result().stream().filter(row -> row.order().id().equals(pending.getId())).findFirst().orElseThrow();
        assertThat(unpaid.payments()).isEmpty();
        assertThat(unpaid.eligibleForApproval()).isFalse();
        assertThat(unpaid.eligibilityReason()).isEqualTo("WAITING_PAYMENT");
        assertThat(unpaid.order().totalAmount()).isEqualByComparingTo("499000");
        var eligible = service.listAdmin(filter(null, null, true, 1, 20));
        assertThat(eligible.meta().total()).isEqualTo(1);
        assertThat(eligible.result().getFirst().order().id()).isEqualTo(ready.getId());
        assertThat(eligible.result().getFirst().reviewPaymentId()).isNotNull();
        assertThat(eligible.result().getFirst().payments().getFirst().currency()).isEqualTo("VND");
        assertThat(eligible.result().getFirst().payments().getFirst().proofUrl()).isNull();
        var blocked = service.listAdmin(filter(null, null, false, 1, 20));
        assertThat(blocked.meta().total()).isEqualTo(3);
        assertThat(blocked.result()).anySatisfy(row -> {
            assertThat(row.order().id()).isEqualTo(mismatch.getId());
            assertThat(row.eligibilityReason()).isEqualTo("PAYMENT_MISMATCH");
        });
        assertThat(orders.findById(ready.getId()).orElseThrow().getStatus()).isEqualTo(SubscriptionOrderStatus.PAYMENT_REVIEW);
    }

    @Test @DisplayName("Order status, amount search, escaped text and pagination apply on the server")
    void listAdmin_filtersAndPagination_returnMatchingOrders() {
        var first = order("Literal%_ plan");
        order("Other plan");
        assertThat(service.listAdmin(filter(null, "499000", null, 1, 1)).meta().total()).isEqualTo(2);
        assertThat(service.listAdmin(filter(null, "499000", null, 2, 1)).result()).hasSize(1);
        assertThat(service.listAdmin(filter(null, "%_", null, 1, 20)).result()).singleElement()
                .satisfies(row -> assertThat(row.order().id()).isEqualTo(first.getId()));
        assertThat(service.listAdmin(new AdminSubscriptionOrderFilter(SubscriptionOrderStatus.PENDING_PAYMENT,
                first.getBakeryId(), null, Instant.now().minusSeconds(60), Instant.now().plusSeconds(60), null, 1, 20))
                .meta().total()).isEqualTo(1);
        assertThatThrownBy(() -> service.listAdmin(new AdminSubscriptionOrderFilter(null, null, null,
                Instant.now(), Instant.now().minusSeconds(60), null, 1, 20))).hasMessageContaining("Start date");
        assertThatThrownBy(() -> service.listAdmin(filter(null, null, null, 0, 20))).hasMessageContaining("Invalid order filters");
    }

    @Test @DisplayName("Wrong currency and submitted gateway entries never enable manual approval")
    void listAdmin_wrongCurrencyOrGateway_notEligible() {
        var currency = order("Currency mismatch");
        payment(currency, "BANK_TRANSFER", "499000", "USD");
        var gateway = order("Gateway pending");
        payment(gateway, "VNPAY", "499000", "VND");
        assertThat(service.listAdmin(filter(null, null, true, 1, 20)).result()).isEmpty();
        assertThat(service.listAdmin(filter(null, null, false, 1, 20)).meta().total()).isEqualTo(2);
    }
}
