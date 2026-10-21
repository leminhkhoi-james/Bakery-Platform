package com.se193262.bakeryservice.feature.addon.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PublicAddOnResponse(UUID id, String name, String description,
        String category, BigDecimal price, String imageUrl) { }
