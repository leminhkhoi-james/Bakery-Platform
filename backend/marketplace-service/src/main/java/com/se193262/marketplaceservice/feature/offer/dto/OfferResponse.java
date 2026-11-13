package com.se193262.marketplaceservice.feature.offer.dto;

import com.se193262.marketplaceservice.feature.offer.OfferStatus;
import com.se193262.marketplaceservice.shared.dto.HistoryResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record OfferResponse(
        UUID id,
        UUID cakeRequestId,
        UUID bakeryId,
        String message,
        BigDecimal cakePrice,
        BigDecimal deliveryFee,
        BigDecimal addOnTotal,
        BigDecimal totalPrice,
        Instant estimatedCompletionAt,
        Instant expiresAt,
        OfferStatus status,
        List<Item> items,
        List<HistoryResponse> statusHistory,
        Instant createdAt,
        Instant updatedAt,
        long version) {
    public record Item(
            UUID id,
            UUID addOnId,
            String itemNameSnapshot,
            String descriptionSnapshot,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {}
}
