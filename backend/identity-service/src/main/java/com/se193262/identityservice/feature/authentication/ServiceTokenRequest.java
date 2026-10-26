package com.se193262.identityservice.feature.authentication;

import jakarta.validation.constraints.*;

public record ServiceTokenRequest(
        @NotBlank String clientId,
        @NotBlank String clientSecret,
        @NotBlank String audience,
        @NotBlank String scope) {}
