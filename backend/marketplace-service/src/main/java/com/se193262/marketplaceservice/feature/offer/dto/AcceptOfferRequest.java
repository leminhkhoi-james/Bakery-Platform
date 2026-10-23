package com.se193262.marketplaceservice.feature.offer.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record AcceptOfferRequest(
        @NotNull UUID deliveryAddressId, @Size(max = 2000) String customerNote) {}
