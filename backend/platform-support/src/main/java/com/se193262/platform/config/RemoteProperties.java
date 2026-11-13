package com.se193262.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("platform.remote")
public record RemoteProperties(
        String identityUrl,
        String bakeryUrl,
        String subscriptionUrl,
        String cakeAiUrl,
        String orderUrl,
        String marketplaceUrl,
        String clientId,
        String clientSecret,
        Duration connectTimeout,
        Duration readTimeout) {}
