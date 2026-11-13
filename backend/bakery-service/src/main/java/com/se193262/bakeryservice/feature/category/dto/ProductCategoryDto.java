package com.se193262.bakeryservice.feature.category.dto;

import com.se193262.bakeryservice.feature.category.entity.ProductCategory;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ProductCategoryDto(
        UUID id,
        @Size(max = 120) String name,
        @Size(max = 140) String slug,
        @PositiveOrZero Integer displayOrder,
        Boolean active
) {
    public static ProductCategoryDto fromEntity(ProductCategory category) {
        return new ProductCategoryDto(category.getId(), category.getName(), category.getSlug(),
                category.getDisplayOrder(), category.isActive());
    }
}
