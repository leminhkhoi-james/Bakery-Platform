package com.se193262.identityservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "security.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
