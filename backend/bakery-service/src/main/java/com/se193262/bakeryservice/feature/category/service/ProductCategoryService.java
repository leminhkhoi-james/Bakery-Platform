package com.se193262.bakeryservice.feature.category.service;

import com.se193262.bakeryservice.feature.category.dto.ProductCategoryDto;

import java.util.List;
import java.util.UUID;

public interface ProductCategoryService {

    List<ProductCategoryDto> list(UUID bakeryId);

    ProductCategoryDto create(UUID bakeryId, ProductCategoryDto request);

    ProductCategoryDto update(UUID bakeryId, UUID categoryId, ProductCategoryDto request);

    void delete(UUID bakeryId, UUID categoryId);
}
