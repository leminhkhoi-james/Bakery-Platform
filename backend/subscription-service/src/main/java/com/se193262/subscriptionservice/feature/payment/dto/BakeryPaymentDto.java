package com.se193262.subscriptionservice.feature.payment.dto;

import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BakeryPaymentDto(
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) UUID id,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) UUID subscriptionOrderId,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) UUID submittedByUserId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "BANK_TRANSFER") @Size(max = 50) String paymentMethod,
        @Size(max = 120) String paymentReference,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) @DecimalMin("0.01") BigDecimal amount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "VND") @Size(min = 3, max = 3) String currency,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) PaymentStatus status,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) UUID reviewedByAdminId,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) String reviewNote,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) Instant submittedAt,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) Instant reviewedAt,
        @Schema(accessMode = Schema.AccessMode.READ_ONLY) String proofUrl
) {
    public BakeryPaymentDto(UUID id, UUID subscriptionOrderId, UUID submittedByUserId,
            String paymentMethod, String paymentReference, BigDecimal amount, String currency,
            PaymentStatus status, UUID reviewedByAdminId, String reviewNote,
            Instant submittedAt, Instant reviewedAt) {
        this(id, subscriptionOrderId, submittedByUserId, paymentMethod, paymentReference,
                amount, currency, status, reviewedByAdminId, reviewNote, submittedAt, reviewedAt, null);
    }

    public static BakeryPaymentDto fromEntity(BakeryPayment payment) {
        return fromEntity(payment, null);
    }

    public static BakeryPaymentDto fromEntity(BakeryPayment payment, String proofUrl) {
        return new BakeryPaymentDto(payment.getId(), payment.getOrder().getId(),
                payment.getSubmittedByUserId(), payment.getPaymentMethod(),
                payment.getPaymentReference(), payment.getAmount(), payment.getCurrency(),
                payment.getStatus(), payment.getReviewedByAdminId(), payment.getReviewNote(),
                payment.getSubmittedAt(), payment.getReviewedAt(), proofUrl);
    }
}
