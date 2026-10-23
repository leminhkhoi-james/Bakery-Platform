package com.se193262.subscriptionservice.feature.payment.service;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.dto.PaymentReviewResponse;
import com.se193262.subscriptionservice.shared.dto.PageResult;

import java.time.Instant;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface BakeryPaymentService {
    BakeryPaymentDto submit(UUID orderId, UUID userId, String idempotencyKey,
                            BakeryPaymentDto request, MultipartFile proof);
    PageResult<BakeryPaymentDto> listForReview(PaymentStatus status, UUID bakeryId,
            Instant submittedFrom, Instant submittedTo, int page, int size, String sort);
    PaymentReviewResponse approve(UUID paymentId, UUID adminId, String idempotencyKey, String reviewNote);
    PaymentReviewResponse reject(UUID paymentId, UUID adminId, String reviewNote);
}
