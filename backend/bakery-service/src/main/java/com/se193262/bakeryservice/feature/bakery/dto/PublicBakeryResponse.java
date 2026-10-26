package com.se193262.bakeryservice.feature.bakery.dto;

import java.util.UUID;

public record PublicBakeryResponse(UUID id, String name, String description,
        String logoUrl, String coverUrl, BakeryOperationsDto.Address primaryAddress,
        BakeryOperationsDto operations) { }
