package com.se193262.subscriptionservice.feature.subscriptionorder.dto;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import java.util.List;
import java.util.UUID;

public record AdminSubscriptionOrderDto(SubscriptionOrderDto order, List<BakeryPaymentDto> payments,
        boolean eligibleForApproval, String eligibilityReason, UUID reviewPaymentId) {

    public static AdminSubscriptionOrderDto fromEntity(SubscriptionOrder order, List<BakeryPayment> payments) {
        BakeryPayment candidate = order.getStatus() == SubscriptionOrderStatus.PAYMENT_REVIEW
                ? payments.stream().filter(payment -> payment.getStatus() == PaymentStatus.SUBMITTED
                        && !"VNPAY".equalsIgnoreCase(payment.getPaymentMethod())
                        && payment.getAmount().signum() > 0
                        && payment.getAmount().compareTo(order.getTotalAmount()) == 0
                        && payment.getCurrency().equals(order.getCurrency())).findFirst().orElse(null)
                : null;
        String reason = candidate != null ? "READY_FOR_REVIEW" : switch (order.getStatus()) {
            case PENDING_PAYMENT -> "WAITING_PAYMENT";
            case COMPLETED -> "COMPLETED";
            case EXPIRED -> "EXPIRED";
            case CANCELLED -> "CANCELLED";
            case REJECTED -> "REJECTED";
            case PAYMENT_REVIEW -> payments.stream().anyMatch(payment -> payment.getStatus() == PaymentStatus.SUBMITTED)
                    ? "PAYMENT_MISMATCH" : "NO_SUBMITTED_PAYMENT";
        };
        return new AdminSubscriptionOrderDto(SubscriptionOrderDto.fromEntity(order, List.of(), null),
                payments.stream().map(BakeryPaymentDto::fromEntity).toList(), candidate != null,
                reason, candidate == null ? null : candidate.getId());
    }
}
