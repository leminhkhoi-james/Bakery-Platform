package com.se193262.orderservice.feature.order.dto;

import java.util.UUID;

public record OrderCreationResponse(UUID orderId, String orderNumber, String status) {}
