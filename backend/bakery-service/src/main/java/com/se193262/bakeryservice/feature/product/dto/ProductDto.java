package com.se193262.bakeryservice.feature.product.dto;

import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductDto(
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) UUID id,
        UUID categoryId,
        @Size(max = 180) String name,
        @Schema(description = "Required and nonblank on create; unique within the bakery; omitted on PATCH preserves the slug", example = "strawberry-birthday-cake") @Size(max = 200) String slug,
        String description,
        @DecimalMin("0.00") BigDecimal basePrice,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) ProductStatus status,
        Boolean customizable,
        @Positive Integer defaultServingSize,
        @PositiveOrZero Integer minimumNoticeHours
) {
    public static ProductDto fromEntity(Product product) {
        return new ProductDto(product.getId(),
                product.getCategory() == null ? null : product.getCategory().getId(),
                product.getName(), product.getSlug(), product.getDescription(), product.getBasePrice(),
                product.getStatus(), product.isCustomizable(), product.getDefaultServingSize(),
                product.getMinimumNoticeHours());
    }
}
