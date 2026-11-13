package com.se193262.orderservice.infrastructure.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@HttpExchange("/internal/v1/users")
public interface IdentityClient {

    @GetExchange("/{userId}")
    UserResponse getUser(@PathVariable UUID userId);

    @GetExchange("/{userId}/addresses/{addressId}")
    AddressResponse getAddress(@PathVariable UUID userId, @PathVariable UUID addressId);

    record UserResponse(
            UUID id,
            String email,
            String displayName,
            String phoneNumber,
            String status,
            List<String> roles
    ) {
    }

    record AddressResponse(
            UUID id,
            String label,
            String recipientName,
            String recipientPhone,
            String addressLine,
            String ward,
            String district,
            String city,
            BigDecimal latitude,
            BigDecimal longitude
    ) {
    }
}