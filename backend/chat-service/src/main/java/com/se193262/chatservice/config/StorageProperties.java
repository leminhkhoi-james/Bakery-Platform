package com.se193262.chatservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "storage.minio")
public record StorageProperties(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        Duration presignedUrlExpiry,
        String publicEndpoint,
        String region
) {
    public StorageProperties {
        publicEndpoint = publicEndpoint == null || publicEndpoint.isBlank() ? endpoint : publicEndpoint;
        region = region == null || region.isBlank() ? "us-east-1" : region;
        java.net.URI origin = java.net.URI.create(publicEndpoint);
        if (!java.util.Set.of("http", "https").contains(origin.getScheme())
                || origin.getHost() == null || origin.getUserInfo() != null
                || origin.getQuery() != null || origin.getFragment() != null
                || !(origin.getPath().isEmpty() || origin.getPath().equals("/"))) {
            throw new IllegalArgumentException("MinIO public endpoint must be an HTTP(S) origin without credentials");
        }
    }
}
