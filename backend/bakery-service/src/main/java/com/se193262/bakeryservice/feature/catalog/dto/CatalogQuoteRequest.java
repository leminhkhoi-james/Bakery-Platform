package com.se193262.bakeryservice.feature.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.UUID;

public record CatalogQuoteRequest(@NotNull UUID bakeryId, @NotNull UUID productId,
        @Positive int quantity, @Valid List<@NotNull OptionSelection> optionSelections,
        @Valid List<@NotNull AddOnSelection> addOns, @NotBlank String deliveryDistrict,
        @NotBlank String deliveryCity) {
    public record OptionSelection(@NotNull UUID optionGroupId,
            @NotNull List<@NotNull UUID> optionValueIds) { }
    public record AddOnSelection(@NotNull UUID addOnId, @Positive int quantity) { }
}
