package com.se193262.marketplaceservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("marketplace.firebase")
public record FirebaseProperties(
        String projectId,
        String bucket,
        java.time.Duration connectTimeout,
        java.time.Duration readTimeout) {}
