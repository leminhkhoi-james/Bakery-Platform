package com.se193262.orderservice.feature.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record OfferOrderSource(
        UUID offerId,
        UUID cakeRequestId,
        UUID customerId,
        UUID bakeryId,
        String title,
        String description,
        Instant neededAt,
        String deliveryCity,
        String deliveryDistrict,
        BigDecimal cakePrice,
        BigDecimal deliveryFee,
        BigDecimal addOnTotal,
        BigDecimal totalPrice,
        Map<String, Object> configuration,
        List<Item> items) {
    public record Item(
            UUID id,
            UUID addOnId,
            String itemNameSnapshot,
            String descriptionSnapshot,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {}
}
