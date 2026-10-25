package com.se193262.bakeryservice.feature.product.controller;

import com.se193262.bakeryservice.feature.product.dto.PublicProductResponse;
import com.se193262.bakeryservice.feature.product.service.PublicProductService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import com.se193262.bakeryservice.shared.dto.PageResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class PublicProductController {
    private final PublicProductService service;

    public PublicProductController(PublicProductService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<PublicProductResponse>>> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID bakeryId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean customizable,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ResponseEntity.ok(ApiResponse.success(service.list(query, bakeryId, categoryId,
                city, customizable, minPrice, maxPrice, page, size, sort)));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<PublicProductResponse>> get(@PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(service.get(productId)));
    }
}
