package com.se193262.bakeryservice.feature.product.dto;

import com.se193262.bakeryservice.feature.addon.dto.PublicAddOnResponse;
import com.se193262.bakeryservice.feature.category.dto.ProductCategoryDto;
import java.util.List;
import java.util.UUID;

public record PublicProductResponse(ProductDto product, UUID bakeryId, String bakeryName,
        ProductCategoryDto category, List<ProductImageResponse> images,
        ProductOptionsDto options, List<PublicAddOnResponse> addOns) { }
