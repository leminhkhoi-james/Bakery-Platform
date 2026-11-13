package com.se193262.bakeryservice.feature.bakery.dto;

import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeBakeryStatusRequest(@NotNull BakeryStatus status) {
}
