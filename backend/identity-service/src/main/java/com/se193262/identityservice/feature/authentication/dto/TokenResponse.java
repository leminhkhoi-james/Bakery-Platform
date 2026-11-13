package com.se193262.identityservice.feature.authentication.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
}
