package com.se193262.marketplaceservice.feature.offer.dto;

import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.AddOn;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record CreateOfferRequest(
        @NotNull UUID bakeryId,
        @Size(max = 4000) String message,
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal cakePrice,
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal deliveryFee,
        @NotNull @Future Instant estimatedCompletionAt,
        @NotNull @Future Instant expiresAt,
        @Size(max = 100) List<@Valid AddOn> items) {}
