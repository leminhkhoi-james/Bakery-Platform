package com.se193262.orderservice.feature.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface OrderReviewRepository extends JpaRepository<OrderReview, UUID> {

    Optional<OrderReview> findByCustomerIdAndId(UUID customerId, UUID orderId);

    Page<OrderReview> findByCustomerOrderBakeryIdAndStatus(
            UUID bakeryId, ReviewStatus status, Pageable pageable);
}
