package com.se193262.bakeryservice.feature.product.repository;

import com.se193262.bakeryservice.feature.product.entity.ProductOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, UUID> {
    List<ProductOptionValue> findAllByOptionGroup_Product_Id(UUID productId);
}
