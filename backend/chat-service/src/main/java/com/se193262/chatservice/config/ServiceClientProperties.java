package com.se193262.chatservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "clients")
public record ServiceClientProperties(
        Service marketplace,
        Service bakery,
        Duration connectTimeout,
        Duration readTimeout
) {
    public record Service(String baseUrl, String serviceToken) {
    }
}
