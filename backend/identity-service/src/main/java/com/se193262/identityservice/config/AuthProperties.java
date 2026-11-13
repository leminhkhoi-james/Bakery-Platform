package com.se193262.identityservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "security.auth")
public record AuthProperties(
        Duration refreshTokenTtl,
        String refreshCookieName,
        String refreshCookiePath,
        boolean refreshCookieSecure,
        String refreshCookieSameSite,
        int bcryptStrength
) {
}
