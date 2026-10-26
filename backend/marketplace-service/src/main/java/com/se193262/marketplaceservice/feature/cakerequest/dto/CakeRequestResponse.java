package com.se193262.marketplaceservice.feature.cakerequest.dto;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.OptionSnapshot;
import com.se193262.marketplaceservice.shared.dto.HistoryResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record CakeRequestResponse(
        UUID id,
        UUID customerId,
        UUID targetBakeryId,
        UUID baseProductId,
        UUID selectedDesignId,
        RequestType requestType,
        String title,
        String description,
        String occasion,
        Integer servingSize,
        BigDecimal budgetMin,
        BigDecimal budgetMax,
        Instant neededAt,
        String deliveryDistrict,
        String deliveryCity,
        RequestStatus status,
        Instant offerDeadline,
        CreateCakeRequestRequest.Preference preference,
        List<OptionSnapshot> optionSelections,
        List<RequestImageResponse> images,
        List<HistoryResponse> statusHistory,
        SelectedDesignSummary selectedDesign,
        List<OfferSummary> offers,
        Instant createdAt,
        Instant updatedAt,
        long version) {
    public record SelectedDesignSummary(UUID id) {}

    public record OfferSummary(
            UUID id,
            UUID bakeryId,
            com.se193262.marketplaceservice.feature.offer.OfferStatus status,
            BigDecimal totalPrice,
            Instant expiresAt) {}
}
