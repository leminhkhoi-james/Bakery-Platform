package com.se193262.orderservice.feature.order.dto;

import com.se193262.orderservice.feature.order.OrderStatus;

import java.util.UUID;

public record OrderReferenceResponse(UUID orderId, String orderNumber, OrderStatus status) {
}