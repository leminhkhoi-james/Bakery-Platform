package com.se193262.orderservice.feature.review.dto;

import com.se193262.orderservice.feature.review.ReviewStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateReviewStatusRequest(@NotNull ReviewStatus status) {
}
