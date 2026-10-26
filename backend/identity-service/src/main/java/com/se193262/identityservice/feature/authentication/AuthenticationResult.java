package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.feature.authentication.dto.TokenResponse;

public record AuthenticationResult(TokenResponse token, String refreshToken) {
}
