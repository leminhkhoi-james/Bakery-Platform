package com.se193262.subscriptionservice.feature.subscriptionorder.dto;

import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SubscriptionOrderDto(
        UUID id,
        String orderNumber,
        UUID bakeryId,
        UUID planId,
        UUID requestedByUserId,
        String planNameSnapshot,
        Integer billingPeriodMonths,
        BigDecimal totalAmount,
        String currency,
        SubscriptionOrderStatus status,
        Instant expiresAt,
        Instant completedAt,
        Instant createdAt,
        List<PaymentSummary> payments,
        PeriodSummary period
) {
    public record PaymentSummary(UUID id, String paymentMethod, String paymentReference,
                                 BigDecimal amount, PaymentStatus status, Instant submittedAt) {
        public static PaymentSummary fromEntity(BakeryPayment payment) {
            return new PaymentSummary(payment.getId(), payment.getPaymentMethod(),
                    payment.getPaymentReference(), payment.getAmount(), payment.getStatus(),
                    payment.getSubmittedAt());
        }
    }

    public record PeriodSummary(UUID id, SubscriptionStatus status, Instant periodStart,
                                Instant periodEnd) {
        public static PeriodSummary fromEntity(BakerySubscription period) {
            return new PeriodSummary(period.getId(), period.getStatus(),
                    period.getPeriodStart(), period.getPeriodEnd());
        }
    }

    public static SubscriptionOrderDto fromEntity(SubscriptionOrder order,
            List<BakeryPayment> payments, BakerySubscription period) {
        return new SubscriptionOrderDto(order.getId(), order.getOrderNumber(), order.getBakeryId(),
                order.getPlan().getId(), order.getRequestedByUserId(), order.getPlanNameSnapshot(),
                order.getBillingPeriodMonths(), order.getTotalAmount(), order.getCurrency(),
                order.getStatus(), order.getExpiresAt(), order.getCompletedAt(), order.getCreatedAt(),
                payments.stream().map(PaymentSummary::fromEntity).toList(),
                period == null ? null : PeriodSummary.fromEntity(period));
    }
}
