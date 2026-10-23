package com.se193262.orderservice.infrastructure.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@HttpExchange("/internal/v1")
public interface BakeryClient {

    @GetExchange("/bakeries/{bakeryId}")
    BakeryResponse getBakery(@PathVariable UUID bakeryId);

    @GetExchange("/bakeries/{bakeryId}/members/{userId}/authorization")
    MembershipAuthorizationResponse getMembershipAuthorization(
            @PathVariable UUID bakeryId,
            @PathVariable UUID userId,
            @RequestParam(required = false) String requiredRole
    );

    @PostExchange("/catalog/quotes")
    CatalogQuoteResponse getCatalogQuote(@RequestBody CatalogQuoteRequest request);

    record BakeryResponse(
            UUID id,
            String name,
            String status,
            BakeryAddress primaryAddress,
            List<ServiceArea> serviceAreas
    ) {
    }

    record BakeryAddress(String district, String city) {
    }

    record ServiceArea(String district, String city, BigDecimal deliveryFee, boolean active) {
    }

    record MembershipAuthorizationResponse(
            UUID bakeryId,
            UUID userId,
            boolean active,
            String memberRole,
            boolean authorized
    ) {
    }

    record CatalogQuoteRequest(
            UUID bakeryId,
            UUID productId,
            int quantity,
            List<OptionSelection> optionSelections,
            List<AddOnSelection> addOns,
            String deliveryDistrict,
            String deliveryCity
    ) {
    }

    record OptionSelection(UUID optionGroupId, List<UUID> optionValueIds) {
    }

    record AddOnSelection(UUID addOnId, int quantity) {
    }

    record CatalogQuoteResponse(
            UUID quoteId,
            UUID bakeryId,
            String bakeryName,
            UUID productId,
            String productName,
            String productDescription,
            int quantity,
            List<QuotedItem> items,
            BigDecimal subtotal,
            BigDecimal deliveryFee,
            BigDecimal totalAmount,
            int minimumNoticeHours,
            Instant expiresAt
    ) {
    }

    record QuotedItem(
            UUID sourceId,
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