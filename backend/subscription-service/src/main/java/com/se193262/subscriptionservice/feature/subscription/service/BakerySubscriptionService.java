package com.se193262.subscriptionservice.feature.subscription.service;

import com.se193262.subscriptionservice.feature.subscription.dto.BakerySubscriptionDto;

import java.util.UUID;

public interface BakerySubscriptionService {
    BakerySubscriptionDto getForBakery(UUID bakeryId);
}
