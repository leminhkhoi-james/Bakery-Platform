package com.se193262.orderservice.feature.review;

import com.se193262.orderservice.feature.review.dto.CreateReviewRequest;
import com.se193262.orderservice.feature.review.dto.ReviewResponse;
import com.se193262.orderservice.feature.review.dto.UpdateReviewRequest;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse create(UUID orderId, UUID customerId, CreateReviewRequest request);

    ReviewResponse update(UUID orderId, UUID customerId, UpdateReviewRequest request);

    void delete(UUID orderId, UUID customerId);

    ReviewResponse moderate(UUID orderId, ReviewStatus status);
}