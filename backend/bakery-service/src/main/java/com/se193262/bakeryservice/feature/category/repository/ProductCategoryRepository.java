package com.se193262.bakeryservice.feature.category.repository;

import com.se193262.bakeryservice.feature.category.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    List<ProductCategory> findAllByBakery_IdOrderByDisplayOrderAsc(UUID bakeryId);

    Optional<ProductCategory> findByIdAndBakery_Id(UUID categoryId, UUID bakeryId);

    boolean existsByBakery_IdAndSlug(UUID bakeryId, String slug);

    boolean existsByBakery_IdAndSlugAndIdNot(UUID bakeryId, String slug, UUID categoryId);
}
