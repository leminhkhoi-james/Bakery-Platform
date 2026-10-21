package com.se193262.bakeryservice.feature.product.repository;

import com.se193262.bakeryservice.feature.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
}
