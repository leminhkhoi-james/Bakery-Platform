package com.se193262.orderservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        String jwkSetUri,
        String issuer,
        String userAudience,
        String serviceAudience
) {
}