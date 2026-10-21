package com.se193262.subscriptionservice.feature.payment.service;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.shared.dto.PageResult;

import java.time.Instant;
import java.util.UUID;

public interface BakeryPaymentService {
    BakeryPaymentDto submit(UUID orderId, UUID userId, String idempotencyKey,
                            BakeryPaymentDto request, boolean proofProvided);
    PageResult<BakeryPaymentDto> listForReview(PaymentStatus status, UUID bakeryId,
            Instant submittedFrom, Instant submittedTo, int page, int size);
}
