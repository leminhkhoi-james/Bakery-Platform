package com.se193262.cakeaiservice.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("cake-ai")
public record CakeAiProperties(
        @DefaultValue("") String apiKey,
        @DefaultValue("https://generativelanguage.googleapis.com/v1beta") String providerUrl,
        @DefaultValue("gemini-nano-banana-2.1") String imageModel,
        @DefaultValue("gemini-3.8-flash") String moderationModel,
        @DefaultValue("5s") Duration connectTimeout,
        @DefaultValue("120s") Duration readTimeout,
        @DefaultValue("2") int workers,
        @DefaultValue("30m") Duration leaseDuration,
        @DefaultValue("") String firebaseProjectId,
        @DefaultValue("") String firebaseBucket) {}
