package com.se193262.orderservice.feature.order.dto;

import com.se193262.orderservice.feature.order.OrderSource;
import com.se193262.orderservice.feature.order.OrderStatus;
import com.se193262.orderservice.feature.review.dto.ReviewResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderNumber,
        UUID customerId,
        UUID bakeryId,
        UUID cakeRequestId,
        UUID offerId,
        OrderSource orderSource,
        String customerName,
        String customerPhone,
        String bakeryName,
        String customerNote,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal totalAmount,
        String currency,
        OrderStatus status,
        Instant neededAt,
        Instant acceptedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt,
        List<OrderItemResponse> items,
        DeliveryAddressResponse deliveryAddress,
        List<OrderStatusHistoryResponse> statusHistory,
        ReviewResponse review
) {
    public record OrderItemResponse(
            UUID id,
            UUID sourceProductId,
            UUID sourceOfferItemId,
            String itemType,
            String name,
            String description,
            Object configuration,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    public record DeliveryAddressResponse(
            String recipientName,
            String recipientPhone,
            String addressLine,
            String ward,
            String district,
            String city,
            BigDecimal latitude,
            BigDecimal longitude,
            String deliveryNote
    ) {
    }

    public record OrderStatusHistoryResponse(
            String fromStatus,
            String toStatus,
            UUID changedBy,
            String note,
            Instant changedAt
    ) {
    }
}
