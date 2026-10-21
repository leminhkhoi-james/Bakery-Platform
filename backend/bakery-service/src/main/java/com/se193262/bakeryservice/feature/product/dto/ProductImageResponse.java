package com.se193262.bakeryservice.feature.product.dto;

import java.time.Instant;
import java.util.UUID;

public record ProductImageResponse(UUID id, String url, Instant expiresAt,
        String mediaType, int displayOrder, boolean primary) { }
