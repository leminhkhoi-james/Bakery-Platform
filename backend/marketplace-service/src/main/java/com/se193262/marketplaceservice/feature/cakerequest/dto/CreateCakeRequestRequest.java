package com.se193262.marketplaceservice.feature.cakerequest.dto;

import com.se193262.marketplaceservice.feature.cakerequest.RequestType;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.Option;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record CreateCakeRequestRequest(
        @NotNull RequestType requestType,
        UUID targetBakeryId,
        UUID baseProductId,
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 10000) String description,
        @Size(max = 100) String occasion,
        @Positive Integer servingSize,
        @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal budgetMin,
        @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal budgetMax,
        @NotNull @Future Instant neededAt,
        @NotBlank @Size(max = 120) String deliveryDistrict,
        @NotBlank @Size(max = 120) String deliveryCity,
        @Future Instant offerDeadline,
        @Valid Preference preference,
        @Size(max = 100) List<@Valid Option> optionSelections) {
    public record Preference(
            @Size(max = 80) String cakeSize,
            @Size(max = 80) String cakeShape,
            @Size(max = 120) String flavor,
            @Size(max = 120) String filling,
            @Size(max = 120) String frosting,
            @Size(max = 255) String colorPalette,
            @Size(max = 4000) String decorationNotes,
            @Size(max = 4000) String allergyNotes,
            Map<String, Object> extraOptions) {}
}
