package com.se193262.orderservice.feature.review.dto;

import com.se193262.orderservice.feature.review.ReviewStatus;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID orderId,
        UUID customerId,
        short rating,
        String comment,
        ReviewStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
