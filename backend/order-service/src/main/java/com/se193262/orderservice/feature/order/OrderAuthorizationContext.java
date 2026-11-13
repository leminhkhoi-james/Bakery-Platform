package com.se193262.orderservice.feature.order;

import java.util.UUID;

public record OrderAuthorizationContext(UUID customerId, UUID bakeryId) {
}