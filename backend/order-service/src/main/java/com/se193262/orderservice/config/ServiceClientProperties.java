package com.se193262.orderservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "clients")
public record ServiceClientProperties(
        Service identity,
        Service bakery,
        Service marketplace,
        Duration connectTimeout,
        Duration readTimeout
) {
    public record Service(String baseUrl) {
    }
}