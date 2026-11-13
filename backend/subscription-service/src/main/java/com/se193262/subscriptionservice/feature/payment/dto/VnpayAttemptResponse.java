package com.se193262.subscriptionservice.feature.payment.dto;

import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VnpayAttemptResponse(UUID id, UUID orderId, BigDecimal amount, VnpayAttempt.Status status,
                                   String transactionNo, Instant createdAt, Instant expiresAt) {
    public static VnpayAttemptResponse fromEntity(VnpayAttempt attempt) {
        return new VnpayAttemptResponse(attempt.getId(), attempt.getOrderId(), attempt.getAmount(),
                attempt.getStatus(), attempt.getTransactionNo(), attempt.getCreatedAt(), attempt.getExpiresAt());
    }
}
