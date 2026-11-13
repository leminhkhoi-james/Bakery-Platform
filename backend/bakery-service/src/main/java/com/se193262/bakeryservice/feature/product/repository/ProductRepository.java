package com.se193262.bakeryservice.feature.product.repository;

import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByIdAndBakery_Id(UUID productId, UUID bakeryId);

    boolean existsByBakery_IdAndSlug(UUID bakeryId, String slug);

    boolean existsByBakery_IdAndSlugAndIdNot(UUID bakeryId, String slug, UUID productId);

    List<Product> findAllByCategory_Id(UUID categoryId);

    @Query("""
            select p from Product p
            where p.bakery.id = :bakeryId
              and (:status is null or p.status = :status)
              and (:categoryId is null or p.category.id = :categoryId)
              and lower(p.name) like lower(concat('%', :query, '%'))
            """)
    Page<Product> findManagement(@Param("bakeryId") UUID bakeryId,
                                 @Param("status") ProductStatus status,
                                 @Param("categoryId") UUID categoryId,
                                 @Param("query") String query,
                                 Pageable pageable);

    @Query("""
            select p from Product p
            where p.status = :productStatus and p.bakery.status = :bakeryStatus
              and (:bakeryId is null or p.bakery.id = :bakeryId)
              and (:categoryId is null or p.category.id = :categoryId)
              and (:customizable is null or p.isCustomizable = :customizable)
              and (:minPrice is null or p.basePrice >= :minPrice)
              and (:maxPrice is null or p.basePrice <= :maxPrice)
              and lower(p.name) like lower(concat('%', :query, '%'))
            """)
    Page<Product> findPublicCandidates(@Param("productStatus") ProductStatus productStatus,
            @Param("bakeryStatus") BakeryStatus bakeryStatus, @Param("bakeryId") UUID bakeryId,
            @Param("categoryId") UUID categoryId, @Param("customizable") Boolean customizable,
            @Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice,
            @Param("query") String query, Pageable pageable);
}
