package com.se193262.bakeryservice.feature.product.service;

import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.shared.dto.PageResult;

import java.util.UUID;

public interface ProductService {

    PageResult<ProductDto> list(UUID bakeryId, ProductStatus status, UUID categoryId,
                                String query, int page, int size);

    ProductDto create(UUID bakeryId, ProductDto request);

    ProductDto update(UUID bakeryId, UUID productId, ProductDto request);

    ProductOptionsDto replaceOptions(UUID bakeryId, UUID productId, ProductOptionsDto request);
}
