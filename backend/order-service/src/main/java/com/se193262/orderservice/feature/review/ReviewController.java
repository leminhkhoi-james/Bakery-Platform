package com.se193262.orderservice.feature.review;

import com.se193262.orderservice.feature.order.OrderAuthenticationRequiredException;
import com.se193262.orderservice.feature.review.dto.CreateReviewRequest;
import com.se193262.orderservice.feature.review.dto.ReviewResponse;
import com.se193262.orderservice.feature.review.dto.UpdateReviewRequest;
import com.se193262.orderservice.feature.review.dto.UpdateReviewStatusRequest;
import com.se193262.orderservice.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @Operation(summary = "Create a review for a completed order")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Review created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Review already exists"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Order is not completed")
    })
    @PostMapping("/orders/{orderId}/review")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse result = reviewService.create(orderId, requiredActorId(jwt), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(result));
    }

    @Operation(summary = "Update a published review")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Review not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Review is not editable")
    })
    @PatchMapping("/orders/{orderId}/review")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateReviewRequest request) {
        ReviewResponse result = reviewService.update(orderId, requiredActorId(jwt), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Soft-delete the caller's review")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Review deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Review not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Review is already deleted")
    })
    @DeleteMapping("/orders/{orderId}/review")
    public ResponseEntity<Void> deleteReview(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt) {
        reviewService.delete(orderId, requiredActorId(jwt));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Moderate a review")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Review status updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Review not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Review transition is invalid")
    })
    @PatchMapping("/admin/reviews/{orderId}/status")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReviewStatus(
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateReviewStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.moderate(orderId, request.status())));
    }

    private UUID requiredActorId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new OrderAuthenticationRequiredException();
        }
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new OrderAuthenticationRequiredException();
        }
    }
}
