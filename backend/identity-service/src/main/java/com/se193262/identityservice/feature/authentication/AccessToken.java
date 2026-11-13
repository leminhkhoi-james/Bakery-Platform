package com.se193262.identityservice.feature.authentication;

public record AccessToken(String value, long expiresInSeconds) {
}
