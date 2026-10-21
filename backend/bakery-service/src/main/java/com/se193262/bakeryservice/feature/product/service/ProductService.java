package com.se193262.bakeryservice.feature.product.service;

import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.dto.ProductImageResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.shared.dto.PageResult;

import java.util.UUID;

public interface ProductService {

    PageResult<ProductDto> list(UUID bakeryId, ProductStatus status, UUID categoryId,
                                String query, int page, int size);

    ProductDto create(UUID bakeryId, ProductDto request);

    ProductDto update(UUID bakeryId, UUID productId, ProductDto request);

    ProductOptionsDto replaceOptions(UUID bakeryId, UUID productId, ProductOptionsDto request);

    List<ProductImageResponse> uploadImages(UUID bakeryId, UUID productId,
            List<MultipartFile> files, Integer primaryIndex, List<Integer> displayOrder);

    void deleteImage(UUID bakeryId, UUID productId, UUID imageId);

    ProductDto publish(UUID bakeryId, UUID productId);

    ProductDto hide(UUID bakeryId, UUID productId);

    ProductDto archive(UUID bakeryId, UUID productId);
}
