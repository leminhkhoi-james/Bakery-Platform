package com.se193262.bakeryservice.feature.product.controller;

import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.service.ProductService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import com.se193262.bakeryservice.shared.dto.PageResult;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@Profile("!prod")
@RequestMapping("/api/v1/bakeries/{bakeryId}/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<ProductDto>>> list(@PathVariable UUID bakeryId,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.list(bakeryId, status, categoryId, query, page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto>> create(@PathVariable UUID bakeryId,
            @Valid @RequestBody ProductDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(productService.create(bakeryId, request)));
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDto>> update(@PathVariable UUID bakeryId,
            @PathVariable UUID productId, @Valid @RequestBody ProductDto request) {
        return ResponseEntity.ok(ApiResponse.success(productService.update(bakeryId, productId, request)));
    }

    @PutMapping("/{productId}/options")
    public ResponseEntity<ApiResponse<ProductOptionsDto>> replaceOptions(@PathVariable UUID bakeryId,
            @PathVariable UUID productId, @Valid @RequestBody ProductOptionsDto request) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.replaceOptions(bakeryId, productId, request)));
    }
}
