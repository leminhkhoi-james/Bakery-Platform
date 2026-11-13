package com.se193262.orderservice.feature.review.dto;

import java.time.Instant;
import java.util.UUID;

/** Public projection; only admin-approved reviews are exposed. */
public record PublicBakeryReviewResponse(
        UUID orderId,
        String customerName,
        short rating,
        String comment,
        Instant createdAt
) {
}
