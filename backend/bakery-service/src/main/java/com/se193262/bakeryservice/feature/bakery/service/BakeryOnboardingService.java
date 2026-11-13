package com.se193262.bakeryservice.feature.bakery.service;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOnboardingRequest;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;

import java.util.UUID;

public interface BakeryOnboardingService {
    BakeryDto get(UUID customerId);
    BakeryDto submit(UUID customerId, BakeryOnboardingRequest request);
    void complete(UUID customerId, UUID bakeryId);
    BakeryDto changeBakeryStatus(UUID bakeryId, BakeryStatus status);
    void reconcileActivation(UUID bakeryId);
}
