package com.se193262.bakeryservice.feature.bakery.dto;

import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record BakeryDto(
        UUID id,
        @Size(max = 180) String name,
        String description,
        @Size(max = 30) String phoneNumber,
        @Email @Size(max = 320) String email,
        BakeryStatus status,
        BakeryOperationsDto operations
) {
}
