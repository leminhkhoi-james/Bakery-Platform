package com.se193262.orderservice.feature.order.dto;

import com.se193262.orderservice.feature.order.OrderSource;
import com.se193262.orderservice.feature.order.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummaryResponse(
        UUID id,
        String orderNumber,
        UUID customerId,
        UUID bakeryId,
        String bakeryName,
        OrderSource orderSource,
        OrderStatus status,
        BigDecimal totalAmount,
        String currency,
        Instant neededAt,
        Instant createdAt
) {
}
