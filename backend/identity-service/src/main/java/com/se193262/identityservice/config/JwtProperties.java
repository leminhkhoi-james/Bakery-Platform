package com.se193262.identityservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Path;
import java.time.Duration;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        Path privateKeyPath,
        Path publicKeyPath,
        String keyId,
        String issuer,
        String userAudience,
        String serviceAudience,
        Duration accessTokenTtl
) {
}
