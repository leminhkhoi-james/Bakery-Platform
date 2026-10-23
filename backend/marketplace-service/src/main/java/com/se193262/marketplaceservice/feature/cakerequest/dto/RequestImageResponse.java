package com.se193262.marketplaceservice.feature.cakerequest.dto;

import java.time.Instant;
import java.util.UUID;

public record RequestImageResponse(
        UUID id,
        String url,
        Instant expiresAt,
        String mediaType,
        int displayOrder,
        long sizeBytes) {}
