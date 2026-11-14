package com.se193262.bakeryservice.feature.addon.dto;

import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.PositiveOrZero;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.UUID;

public record AddOnDto(
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) UUID id,
        @Size(max = 160) String name,
        String description,
        @Size(max = 80) String category,
        @DecimalMin("0.00") BigDecimal price,
        Boolean active,
        @PositiveOrZero Integer stockQuantity,
        @Schema(description = "Current entity version is required when PATCH changes stockQuantity; missing or stale version returns 409") @PositiveOrZero Long version
) {
    public AddOnDto(UUID id, String name, String description, String category, BigDecimal price, Boolean active) {
        this(id, name, description, category, price, active, null, null);
    }

    public static AddOnDto fromEntity(AddOn addOn) {
        return new AddOnDto(addOn.getId(), addOn.getName(), addOn.getDescription(),
                addOn.getCategory(), addOn.getPrice(), addOn.isActive(), addOn.getStockQuantity(), addOn.getVersion());
    }
}
