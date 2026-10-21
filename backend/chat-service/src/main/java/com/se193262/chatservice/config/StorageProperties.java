package com.se193262.chatservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "storage.minio")
public record StorageProperties(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        Duration presignedUrlExpiry
) {
}
