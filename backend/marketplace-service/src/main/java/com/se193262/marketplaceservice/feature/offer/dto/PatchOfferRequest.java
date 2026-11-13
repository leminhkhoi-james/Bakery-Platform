package com.se193262.marketplaceservice.feature.offer.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Map;

public record PatchOfferRequest(Map<String, Object> changes) {
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public PatchOfferRequest {}

    /** Documentation shape for the flat JSON captured by the delegating creator. */
    @io.swagger.v3.oas.annotations.media.Schema(name = "OfferPatch", description = "Flat subset of editable offer fields. Omitted fields are unchanged; message may be null. Only unexpired PENDING offers of the owning bakery can be edited.",
            additionalProperties = io.swagger.v3.oas.annotations.media.Schema.AdditionalPropertiesValue.FALSE)
    public record Fields(
            @io.swagger.v3.oas.annotations.media.Schema(maxLength = 4000, nullable = true) String message,
            @io.swagger.v3.oas.annotations.media.Schema(minimum = "0", maximum = "9999999999.99", multipleOf = 0.01) java.math.BigDecimal cakePrice,
            @io.swagger.v3.oas.annotations.media.Schema(minimum = "0", maximum = "9999999999.99", multipleOf = 0.01) java.math.BigDecimal deliveryFee,
            java.time.Instant estimatedCompletionAt,
            java.time.Instant expiresAt,
            @io.swagger.v3.oas.annotations.media.ArraySchema(maxItems = 100) java.util.List<com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.AddOn> items) {}
}
