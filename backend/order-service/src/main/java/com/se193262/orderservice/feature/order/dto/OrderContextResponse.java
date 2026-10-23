package com.se193262.orderservice.feature.order.dto;

import com.se193262.orderservice.feature.order.OrderStatus;

import java.util.UUID;

public record OrderContextResponse(
        UUID orderId,
        UUID customerId,
        UUID bakeryId,
        UUID cakeRequestId,
        UUID offerId,
        OrderStatus status,
        boolean reviewEligible
) {
}
