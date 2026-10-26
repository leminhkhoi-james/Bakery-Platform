package com.se193262.marketplaceservice.feature.cakerequest.dto;

import com.se193262.marketplaceservice.feature.cakerequest.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CakeRequestSummaryResponse(
        UUID id,
        UUID targetBakeryId,
        RequestType requestType,
        String title,
        BigDecimal budgetMin,
        BigDecimal budgetMax,
        Instant neededAt,
        String deliveryCity,
        String deliveryDistrict,
        RequestStatus status,
        Instant offerDeadline,
        Instant createdAt) {}
