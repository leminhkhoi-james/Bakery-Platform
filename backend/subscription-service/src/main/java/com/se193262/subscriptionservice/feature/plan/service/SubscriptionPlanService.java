package com.se193262.subscriptionservice.feature.plan.service;

import com.se193262.subscriptionservice.feature.plan.dto.SubscriptionPlanDto;

import java.util.List;
import java.util.UUID;

public interface SubscriptionPlanService {
    List<SubscriptionPlanDto> listPublic();
    SubscriptionPlanDto getPublic(UUID planId);
    List<SubscriptionPlanDto> listAdmin();
    SubscriptionPlanDto create(SubscriptionPlanDto request);
    SubscriptionPlanDto update(UUID planId, SubscriptionPlanDto request);
    SubscriptionPlanDto archive(UUID planId);
}
