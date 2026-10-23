package com.se193262.orderservice.infrastructure.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@HttpExchange("/internal/v1")
public interface MarketplaceClient {

    @GetExchange("/offers/{offerId}/order-source")
    AcceptedOfferOrderSourceResponse getAcceptedOfferOrderSource(@PathVariable UUID offerId);

    record AcceptedOfferOrderSourceResponse(
            UUID offerId,
            UUID cakeRequestId,
            UUID customerId,
            UUID bakeryId,
            String customerName,
            String customerPhone,
            String bakeryName,
            List<OfferItemSnapshot> items,
            BigDecimal subtotal,
            BigDecimal deliveryFee,
            BigDecimal totalAmount,
            Instant requestedDeliveryAt
    ) {
    }

    record OfferItemSnapshot(
            UUID sourceOfferItemId,
            String itemType,
            String name,
            String description,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            Map<String, Object> configuration
    ) {
    }
}