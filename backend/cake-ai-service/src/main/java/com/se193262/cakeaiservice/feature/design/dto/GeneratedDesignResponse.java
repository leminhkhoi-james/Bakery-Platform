package com.se193262.cakeaiservice.feature.design.dto;

import com.se193262.cakeaiservice.feature.generation.GenerationRepository.ModerationEvent;
import java.time.Instant;
import java.util.*;

public record GeneratedDesignResponse(UUID id, UUID generationJobId, UUID promptRevisionId,
        String moderationStatus, String moderationReason, String imageUrl, String thumbnailUrl,
        Instant expiresAt, String mediaType, Long sizeBytes, Integer width, Integer height, Instant createdAt,
        UUID customerId, UUID cakeRequestId, UUID moderatedBy, Instant moderatedAt,
        Map<String, Object> providerMetadata, List<ModerationEvent> moderationHistory) {}
