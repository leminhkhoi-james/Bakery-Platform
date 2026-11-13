package com.se193262.marketplaceservice.feature.offer.dto;

import java.util.UUID;

public record AcceptanceResponse(
        UUID offerId,
        UUID cakeRequestId,
        UUID orderId,
        String orderNumber,
        String offerStatus,
        String requestStatus) {}
