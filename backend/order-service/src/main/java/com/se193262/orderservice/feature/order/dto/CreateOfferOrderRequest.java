package com.se193262.orderservice.feature.order.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record CreateOfferOrderRequest(
        @NotNull UUID offerId,
        @NotNull UUID cakeRequestId,
        @NotNull UUID customerId,
        @NotNull UUID deliveryAddressId,
        @Size(max = 2000) String deliveryNote) {}
