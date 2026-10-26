package com.se193262.bakeryservice.feature.addon.dto;

import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record AddOnDto(
        UUID id,
        @Size(max = 160) String name,
        String description,
        @Size(max = 80) String category,
        @DecimalMin("0.00") BigDecimal price,
        Boolean active
) {
    public static AddOnDto fromEntity(AddOn addOn) {
        return new AddOnDto(addOn.getId(), addOn.getName(), addOn.getDescription(),
                addOn.getCategory(), addOn.getPrice(), addOn.isActive());
    }
}
