package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import java.time.Instant;
import java.util.UUID;

public final class GenerationData {
    private GenerationData() {}
    public record Job(UUID id, UUID customerId, UUID cakeRequestId, String status, String modelName,
            GenerationParameters generationParameters, String errorMessage, Instant startedAt,
            Instant completedAt, Instant createdAt, Instant updatedAt) {}
    public record Revision(UUID id, UUID generationJobId, int revisionNumber, String prompt,
            String negativePrompt, UUID createdBy, Instant createdAt) {}
    public record Source(UUID id, UUID generationJobId, String objectKey, String mediaType,
            long sizeBytes, int displayOrder) {}
    public record Execution(UUID id, UUID generationJobId, UUID promptRevisionId, String status,
            String modelName, GenerationParameters generationParameters, UUID claimToken) {}
    public record Design(UUID id, UUID generationJobId, UUID promptRevisionId, UUID executionId,
            String imageObjectKey, String thumbnailObjectKey, String mediaType, Long sizeBytes,
            Integer width, Integer height, String moderationStatus, String moderationReason, Instant createdAt) {}
}
