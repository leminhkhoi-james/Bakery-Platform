package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderResponse;

public record OrderCreationResult(OrderResponse order, boolean replayed) {
}