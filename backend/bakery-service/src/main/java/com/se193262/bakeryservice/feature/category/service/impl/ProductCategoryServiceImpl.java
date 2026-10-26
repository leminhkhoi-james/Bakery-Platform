package com.se193262.bakeryservice.feature.category.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.category.dto.ProductCategoryDto;
import com.se193262.bakeryservice.feature.category.entity.ProductCategory;
import com.se193262.bakeryservice.feature.category.repository.ProductCategoryRepository;
import com.se193262.bakeryservice.feature.category.service.ProductCategoryService;
import com.se193262.bakeryservice.feature.product.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProductCategoryServiceImpl implements ProductCategoryService {

    private final ProductCategoryRepository categoryRepository;
    private final BakeryRepository bakeryRepository;
    private final ProductRepository productRepository;

    public ProductCategoryServiceImpl(ProductCategoryRepository categoryRepository,
                                      BakeryRepository bakeryRepository,
                                      ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.bakeryRepository = bakeryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCategoryDto> list(UUID bakeryId) {
        findBakery(bakeryId);
        return categoryRepository.findAllByBakery_IdOrderByDisplayOrderAsc(bakeryId)
                .stream().map(ProductCategoryDto::fromEntity).toList();
    }

    @Override
    @Transactional
    public ProductCategoryDto create(UUID bakeryId, ProductCategoryDto request) {
        rejectId(request);
        Bakery bakery = findBakery(bakeryId);
        String name = required(request.name(), "name");
        String slug = required(request.slug(), "slug");
        if (categoryRepository.existsByBakery_IdAndSlug(bakeryId, slug)) {
            throw new AppException(HttpStatus.CONFLICT, "Category slug already exists");
        }
        ProductCategory category = new ProductCategory(bakery, name, slug);
        category.update(null, null, request.displayOrder(), request.active());
        return ProductCategoryDto.fromEntity(categoryRepository.saveAndFlush(category));
    }

    @Override
    @Transactional
    public ProductCategoryDto update(UUID bakeryId, UUID categoryId, ProductCategoryDto request) {
        rejectId(request);
        ProductCategory category = categoryRepository.findByIdAndBakery_Id(categoryId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        String slug = request.slug() == null ? null : required(request.slug(), "slug");
        if (slug != null && categoryRepository.existsByBakery_IdAndSlugAndIdNot(bakeryId, slug, categoryId)) {
            throw new AppException(HttpStatus.CONFLICT, "Category slug already exists");
        }
        category.update(request.name() == null ? null : required(request.name(), "name"),
                slug, request.displayOrder(), request.active());
        categoryRepository.flush();
        return ProductCategoryDto.fromEntity(category);
    }

    @Override
    @Transactional
    public void delete(UUID bakeryId, UUID categoryId) {
        ProductCategory category = categoryRepository.findByIdAndBakery_Id(categoryId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Category not found"));
        productRepository.findAllByCategory_Id(categoryId)
                .forEach(product -> product.updateCategory(null));
        productRepository.flush();
        categoryRepository.delete(category);
        categoryRepository.flush();
    }

    private Bakery findBakery(UUID bakeryId) {
        return bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
    }

    private static void rejectId(ProductCategoryDto request) {
        if (request == null || request.id() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Request must not contain an ID");
        }
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }
}
