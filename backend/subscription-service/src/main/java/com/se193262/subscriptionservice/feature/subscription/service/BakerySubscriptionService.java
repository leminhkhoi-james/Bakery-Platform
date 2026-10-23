package com.se193262.subscriptionservice.feature.subscription.service;

import com.se193262.subscriptionservice.feature.subscription.dto.BakerySubscriptionDto;
import com.se193262.subscriptionservice.feature.subscription.dto.EntitlementResponse;

import java.util.UUID;

public interface BakerySubscriptionService {
    BakerySubscriptionDto getForBakery(UUID bakeryId);
    BakerySubscriptionDto getForBakery(UUID bakeryId, UUID userId, boolean admin);
    EntitlementResponse entitlement(UUID bakeryId);
}
