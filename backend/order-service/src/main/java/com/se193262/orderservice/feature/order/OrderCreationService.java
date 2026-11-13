package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.CreateDirectOrderRequest;
import com.se193262.orderservice.feature.order.dto.CreateOfferOrderRequest;

import java.util.UUID;

public interface OrderCreationService {

    OrderCreationResult createDirectOrder(UUID customerId, UUID idempotencyKey, CreateDirectOrderRequest request);

    OrderCreationResult createFromAcceptedOffer(UUID idempotencyKey, CreateOfferOrderRequest request);
}