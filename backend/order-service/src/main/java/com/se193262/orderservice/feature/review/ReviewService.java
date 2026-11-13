package com.se193262.orderservice.feature.review;

import com.se193262.orderservice.feature.review.dto.CreateReviewRequest;
import com.se193262.orderservice.feature.review.dto.ReviewResponse;
import com.se193262.orderservice.feature.review.dto.PublicBakeryReviewResponse;
import com.se193262.orderservice.feature.review.dto.UpdateReviewRequest;
import com.se193262.orderservice.shared.dto.PageResult;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse create(UUID orderId, UUID customerId, CreateReviewRequest request);

    ReviewResponse update(UUID orderId, UUID customerId, UpdateReviewRequest request);

    void delete(UUID orderId, UUID customerId);

    ReviewResponse moderate(UUID orderId, ReviewStatus status);

    PageResult<PublicBakeryReviewResponse> listPublishedByBakery(UUID bakeryId, int page, int size);
}
