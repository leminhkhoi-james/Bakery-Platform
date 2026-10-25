package com.se193262.cakeaiservice.feature.design.dto;

import java.time.Instant;
import java.util.UUID;

public record GeneratedDesignResponse(UUID id, UUID generationJobId, UUID promptRevisionId,
        String moderationStatus, String moderationReason, String imageUrl, String thumbnailUrl,
        Instant expiresAt, String mediaType, Long sizeBytes, Integer width, Integer height, Instant createdAt) {}
