package com.se193262.subscriptionservice.infrastructure.scheduler;

import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionLifecycleJobTest {
    @Mock BakerySubscriptionRepository subscriptions;
    @Mock SubscriptionOrderRepository orders;
    @InjectMocks SubscriptionLifecycleJob job;

    @Test
    void expiresUnpaidOrdersAndOldPeriodsThenActivatesDueRenewal() {
        Instant now = Instant.now();
        SubscriptionPlan plan = new SubscriptionPlan("PRO", "Pro", BigDecimal.TEN);
        SubscriptionOrder unpaid = new SubscriptionOrder("SUB-1", UUID.randomUUID(), plan,
                UUID.randomUUID(), now.minusSeconds(1));
        SubscriptionOrder source = new SubscriptionOrder("SUB-2", UUID.randomUUID(), plan,
                UUID.randomUUID(), now.plusSeconds(3600));
        BakerySubscription old = new BakerySubscription(source,
                now.minusSeconds(3600), now.minusSeconds(10), now.minusSeconds(3600));
        BakerySubscription due = new BakerySubscription(source,
                now.plusSeconds(3600), now.plusSeconds(7200), now);
        ReflectionTestUtils.setField(due, "periodStart", now.minusSeconds(1));

        when(orders.findAllByStatusAndExpiresAtLessThanEqual(eq(SubscriptionOrderStatus.PENDING_PAYMENT), any()))
                .thenReturn(List.of(unpaid));
        when(subscriptions.findAllByStatusAndPeriodEndLessThanEqual(eq(SubscriptionStatus.ACTIVE), any()))
                .thenReturn(List.of(old));
        when(subscriptions.findAllByStatusAndPeriodStartLessThanEqual(eq(SubscriptionStatus.SCHEDULED), any()))
                .thenReturn(List.of(due));

        job.reconcile();
        assertThat(unpaid.getStatus()).isEqualTo(SubscriptionOrderStatus.EXPIRED);
        assertThat(old.getStatus()).isEqualTo(SubscriptionStatus.EXPIRED);
        assertThat(due.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
    }
}
