package com.se193262.bakeryservice.feature.product.controller;

import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.dto.ProductImageResponse;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.service.ProductService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import com.se193262.bakeryservice.shared.dto.PageResult;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

import java.util.UUID;

@RestController
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

    @PostMapping(value = "/{productId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> uploadImages(@PathVariable UUID bakeryId,
            @PathVariable UUID productId, @RequestPart("files") List<MultipartFile> files,
            @RequestParam(required = false) Integer primaryIndex,
            @RequestPart(required = false) List<Integer> displayOrder) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                productService.uploadImages(bakeryId, productId, files, primaryIndex, displayOrder)));
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID bakeryId, @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        productService.deleteImage(bakeryId, productId, imageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{productId}/publish")
    public ResponseEntity<ApiResponse<ProductDto>> publish(@PathVariable UUID bakeryId,
            @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.publish(bakeryId, productId)));
    }

    @PostMapping("/{productId}/hide")
    public ResponseEntity<ApiResponse<ProductDto>> hide(@PathVariable UUID bakeryId,
            @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.hide(bakeryId, productId)));
    }

    @PostMapping("/{productId}/archive")
    public ResponseEntity<ApiResponse<ProductDto>> archive(@PathVariable UUID bakeryId,
            @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.archive(bakeryId, productId)));
    }
}
