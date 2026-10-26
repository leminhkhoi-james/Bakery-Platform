package com.se193262.marketplaceservice.feature.cakerequest.dto;

import com.se193262.marketplaceservice.feature.cakerequest.RequestStatus;

import java.util.UUID;

public record ChatAuthorizationResponse(
        UUID cakeRequestId,
        UUID customerId,
        UUID bakeryId,
        RequestStatus requestStatus,
        boolean authorized) {
}
