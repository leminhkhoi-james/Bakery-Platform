package com.se193262.orderservice.feature.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderReviewRepository extends JpaRepository<OrderReview, UUID> {

    Optional<OrderReview> findByCustomerIdAndId(UUID customerId, UUID orderId);
}