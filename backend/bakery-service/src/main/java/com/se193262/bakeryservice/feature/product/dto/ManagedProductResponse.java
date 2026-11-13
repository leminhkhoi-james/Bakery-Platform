package com.se193262.bakeryservice.feature.product.dto;

import java.util.List;
import java.util.UUID;

public record ManagedProductResponse(ProductDto product, UUID bakeryId,
                                     List<ProductImageResponse> images, ProductOptionsDto options) { }
