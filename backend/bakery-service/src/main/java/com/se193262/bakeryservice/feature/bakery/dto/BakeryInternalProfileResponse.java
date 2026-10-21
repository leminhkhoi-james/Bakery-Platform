package com.se193262.bakeryservice.feature.bakery.dto;

import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BakeryInternalProfileResponse(UUID id, String name, BakeryStatus status,
        Address primaryAddress, List<Area> serviceAreas) {
    public record Address(String district, String city) { }
    public record Area(String district, String city, BigDecimal deliveryFee, boolean active) { }
}
