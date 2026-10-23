package com.se193262.bakeryservice.feature.bakery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record BakeryOperationsDto(
        @NotNull List<@NotNull @Valid Address> addresses,
        @NotNull List<@NotNull @Valid ServiceArea> serviceAreas,
        @NotNull List<@NotNull @Valid BusinessHour> businessHours
) {

    public record Address(
            UUID id,
            @NotBlank @Size(max = 255) String addressLine,
            @Size(max = 120) String ward,
            @NotBlank @Size(max = 120) String district,
            @NotBlank @Size(max = 120) String city,
            @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
            @NotNull Boolean isPrimary
    ) {
    }

    public record ServiceArea(
            UUID id,
            @NotBlank @Size(max = 120) String city,
            @NotBlank @Size(max = 120) String district,
            @NotNull @DecimalMin("0.00") BigDecimal deliveryFee,
            @NotNull @DecimalMin("0.00") BigDecimal minimumOrder,
            @NotNull Boolean active
    ) {
    }

    public record BusinessHour(
            @NotNull @Min(1) @Max(7) Short dayOfWeek,
            LocalTime opensAt,
            LocalTime closesAt,
            @NotNull Boolean closed
    ) {
    }
}
