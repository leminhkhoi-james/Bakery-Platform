package com.se193262.subscriptionservice.feature.subscriptionorder.service;

import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.shared.dto.PageResult;

import java.util.UUID;

public interface SubscriptionOrderService {
    SubscriptionOrderDto create(UUID bakeryId, UUID userId, String idempotencyKey,
                                SubscriptionOrderDto request);
    PageResult<SubscriptionOrderDto> list(UUID bakeryId, UUID userId, boolean admin,
            SubscriptionOrderStatus status, int page, int size, String sort);
    SubscriptionOrderDto get(UUID orderId, UUID userId, boolean admin);
}
