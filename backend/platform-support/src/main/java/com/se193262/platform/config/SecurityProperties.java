package com.se193262.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("platform.security")
public record SecurityProperties(
        String audience, String jwkSetUri, String issuer, String userAudience) {}
