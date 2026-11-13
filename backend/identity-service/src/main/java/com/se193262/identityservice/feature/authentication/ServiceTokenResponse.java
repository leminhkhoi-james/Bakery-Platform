package com.se193262.identityservice.feature.authentication;

public record ServiceTokenResponse(String accessToken, long expiresIn) {}
