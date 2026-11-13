package com.se193262.orderservice.feature.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateDirectOrderRequest(
        @NotNull UUID bakeryId,
        @NotNull UUID productId,
        @NotNull @Positive Integer quantity,
        @Size(max = 20) List<@Valid OptionSelection> optionSelections,
        @Size(max = 20) List<@Valid AddOnSelection> addOns,
        @NotNull UUID deliveryAddressId,
        @NotNull @Future Instant requestedDeliveryAt,
        @Size(max = 1000) String customerNote
) {
    public record OptionSelection(@NotNull UUID optionGroupId, @Size(min = 1) List<@NotNull UUID> optionValueIds) {
    }

    public record AddOnSelection(@NotNull UUID addOnId, @NotNull @Positive Integer quantity) {
    }
}
