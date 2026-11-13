package com.se193262.bakeryservice.feature.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CatalogQuoteResponse(UUID quoteId, UUID bakeryId, String bakeryName,
        UUID productId, String productName, String productDescription, int quantity,
        List<QuotedItem> items, BigDecimal subtotal, BigDecimal deliveryFee,
        BigDecimal totalAmount, int minimumNoticeHours, Instant expiresAt) {
    public record QuotedItem(UUID sourceId, String itemType, String name,
            String description, int quantity, BigDecimal unitPrice,
            BigDecimal lineTotal, Map<String, Object> configuration) { }
}
