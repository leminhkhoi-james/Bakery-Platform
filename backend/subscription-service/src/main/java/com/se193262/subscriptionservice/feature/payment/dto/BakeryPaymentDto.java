package com.se193262.subscriptionservice.feature.payment.dto;

import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BakeryPaymentDto(
        UUID id,
        UUID subscriptionOrderId,
        UUID submittedByUserId,
        @Size(max = 50) String paymentMethod,
        @Size(max = 120) String paymentReference,
        @DecimalMin("0.01") BigDecimal amount,
        @Size(min = 3, max = 3) String currency,
        PaymentStatus status,
        UUID reviewedByAdminId,
        String reviewNote,
        Instant submittedAt,
        Instant reviewedAt
) {
    public static BakeryPaymentDto fromEntity(BakeryPayment payment) {
        return new BakeryPaymentDto(payment.getId(), payment.getOrder().getId(),
                payment.getSubmittedByUserId(), payment.getPaymentMethod(),
                payment.getPaymentReference(), payment.getAmount(), payment.getCurrency(),
                payment.getStatus(), payment.getReviewedByAdminId(), payment.getReviewNote(),
                payment.getSubmittedAt(), payment.getReviewedAt());
    }
}
