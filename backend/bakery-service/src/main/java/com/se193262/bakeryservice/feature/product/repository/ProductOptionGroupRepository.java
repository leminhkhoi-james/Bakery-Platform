package com.se193262.bakeryservice.feature.product.repository;

import com.se193262.bakeryservice.feature.product.entity.ProductOptionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductOptionGroupRepository extends JpaRepository<ProductOptionGroup, UUID> {
    List<ProductOptionGroup> findAllByProduct_IdOrderByDisplayOrderAsc(UUID productId);
}
