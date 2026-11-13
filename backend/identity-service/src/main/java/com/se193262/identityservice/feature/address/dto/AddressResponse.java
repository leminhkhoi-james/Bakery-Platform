package com.se193262.identityservice.feature.address.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AddressResponse(
        UUID id, String label, String recipientName, String recipientPhone,
        String addressLine, String ward, String district, String city,
        BigDecimal latitude, BigDecimal longitude, boolean isDefault) {
}
