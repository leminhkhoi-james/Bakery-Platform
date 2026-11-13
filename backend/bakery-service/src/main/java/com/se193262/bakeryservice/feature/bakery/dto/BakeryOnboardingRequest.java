package com.se193262.bakeryservice.feature.bakery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BakeryOnboardingRequest(
        @NotBlank @Size(max = 180) String name,
        @NotBlank @Size(max = 30) String phoneNumber,
        @Email @Size(max = 320) String email,
        @NotNull @Valid BakeryOperationsDto operations
) {
    public BakeryDto profile() {
        return new BakeryDto(null, name, null, phoneNumber, email, null, null);
    }
}
