package com.se193262.subscriptionservice.feature.payment.controller;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.dto.PaymentReviewResponse;
import com.se193262.subscriptionservice.feature.payment.dto.ReviewPaymentRequest;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/bakery-payments")
public class AdminBakeryPaymentController {
    private final BakeryPaymentService paymentService;

    public AdminBakeryPaymentController(BakeryPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<BakeryPaymentDto>>> list(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) UUID bakeryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant submittedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant submittedTo,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "submittedAt,asc") String sort) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.listForReview(
                status, bakeryId, submittedFrom, submittedTo, page, size, sort)));
    }

    @PostMapping("/{paymentId}/approve")
    public ResponseEntity<ApiResponse<PaymentReviewResponse>> approve(@PathVariable UUID paymentId,
            @AuthenticationPrincipal Jwt jwt, @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody ReviewPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.approve(paymentId,
                UUID.fromString(jwt.getSubject()), idempotencyKey, request.reviewNote())));
    }

    @PostMapping("/{paymentId}/reject")
    public ResponseEntity<ApiResponse<PaymentReviewResponse>> reject(@PathVariable UUID paymentId,
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReviewPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.reject(paymentId,
                UUID.fromString(jwt.getSubject()), request.reviewNote())));
    }
}
