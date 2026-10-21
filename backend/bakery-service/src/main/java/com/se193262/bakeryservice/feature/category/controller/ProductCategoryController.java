package com.se193262.bakeryservice.feature.category.controller;

import com.se193262.bakeryservice.feature.category.dto.ProductCategoryDto;
import com.se193262.bakeryservice.feature.category.service.ProductCategoryService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bakeries/{bakeryId}/categories")
public class ProductCategoryController {

    private final ProductCategoryService categoryService;

    public ProductCategoryController(ProductCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductCategoryDto>>> list(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.list(bakeryId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductCategoryDto>> create(@PathVariable UUID bakeryId,
            @Valid @RequestBody ProductCategoryDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(categoryService.create(bakeryId, request)));
    }

    @PatchMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<ProductCategoryDto>> update(@PathVariable UUID bakeryId,
            @PathVariable UUID categoryId, @Valid @RequestBody ProductCategoryDto request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.update(bakeryId, categoryId, request)));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(@PathVariable UUID bakeryId, @PathVariable UUID categoryId) {
        categoryService.delete(bakeryId, categoryId);
        return ResponseEntity.noContent().build();
    }
}
