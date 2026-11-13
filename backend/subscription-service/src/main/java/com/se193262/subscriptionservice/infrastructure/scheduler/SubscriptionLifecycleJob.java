package com.se193262.subscriptionservice.infrastructure.scheduler;

import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class SubscriptionLifecycleJob {
    private final BakerySubscriptionRepository subscriptions;
    private final SubscriptionOrderRepository orders;

    public SubscriptionLifecycleJob(BakerySubscriptionRepository subscriptions,
            SubscriptionOrderRepository orders) {
        this.subscriptions = subscriptions;
        this.orders = orders;
    }

    @Scheduled(fixedDelayString = "${subscription.lifecycle-interval-ms:60000}")
    @Transactional
    public void reconcile() {
        Instant now = Instant.now();
        orders.findAllByStatusAndExpiresAtLessThanEqual(SubscriptionOrderStatus.PENDING_PAYMENT, now)
                .forEach(order -> order.expire());
        subscriptions.findAllByStatusAndPeriodEndLessThanEqual(SubscriptionStatus.ACTIVE, now)
                .forEach(period -> period.expire());
        subscriptions.flush();
        subscriptions.findAllByStatusAndPeriodStartLessThanEqual(SubscriptionStatus.SCHEDULED, now)
                .forEach(period -> {
                    if (!period.getPeriodEnd().isAfter(now)) period.expire();
                    else period.activate(now);
                });
        subscriptions.flush();
        orders.flush();
    }
}
