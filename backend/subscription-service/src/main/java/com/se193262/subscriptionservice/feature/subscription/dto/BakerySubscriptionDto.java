package com.se193262.subscriptionservice.feature.subscription.dto;

import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record BakerySubscriptionDto(UUID bakeryId, Period currentSubscription,
                                    Period scheduledSubscription, Map<String, String> features) {
    public record Period(UUID id, UUID planId, String planCode, SubscriptionStatus status,
                         Instant periodStart, Instant periodEnd) {
        public static Period fromEntity(BakerySubscription subscription) {
            return new Period(subscription.getId(), subscription.getPlan().getId(),
                    subscription.getSourceOrder().getPlanCodeSnapshot(), subscription.getStatus(),
                    subscription.getPeriodStart(), subscription.getPeriodEnd());
        }
    }
}
