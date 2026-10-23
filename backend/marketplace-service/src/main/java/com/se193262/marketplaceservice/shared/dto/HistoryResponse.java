package com.se193262.marketplaceservice.shared.dto;

import java.time.Instant;
import java.util.UUID;

public record HistoryResponse(
        String fromStatus, String toStatus, UUID changedBy, String reason, Instant changedAt) {}
