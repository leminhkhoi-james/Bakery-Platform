package com.se193262.bakeryservice.feature.product.repository;

import com.se193262.bakeryservice.feature.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
    java.util.List<ProductImage> findAllByProduct_IdOrderByDisplayOrderAsc(UUID productId);

    java.util.Optional<ProductImage> findByIdAndProduct_Id(UUID imageId, UUID productId);

    long countByProduct_Id(UUID productId);

    @Query("select count(image) > 0 from ProductImage image "
            + "where image.product.id = :productId and image.isPrimary = true")
    boolean existsByProduct_IdAndIsPrimaryTrue(@Param("productId") UUID productId);
}
