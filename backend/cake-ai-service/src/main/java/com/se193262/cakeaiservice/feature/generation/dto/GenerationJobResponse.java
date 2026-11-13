package com.se193262.cakeaiservice.feature.generation.dto;

import java.time.Instant;
import java.util.UUID;

public record GenerationJobResponse(UUID id, String status, String modelName, int currentRevision,
        Instant createdAt, Instant updatedAt) {}
