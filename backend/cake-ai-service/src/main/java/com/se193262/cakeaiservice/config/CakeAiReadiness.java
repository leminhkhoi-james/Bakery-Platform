package com.se193262.cakeaiservice.config;

import com.se193262.cakeaiservice.infrastructure.client.ImageProvider;
import com.se193262.cakeaiservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.client.ServiceHttpClient;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;
import java.util.*;

@Component("cakeAi")
public class CakeAiReadiness implements HealthIndicator {
    private final CakeAiProperties properties;
    private final GenerationPolicy policy;
    private final ImageProvider provider;
    private final ImageStorage storage;
    private final ServiceHttpClient internal;
    public CakeAiReadiness(CakeAiProperties properties, GenerationPolicy policy, ImageProvider provider,
            ImageStorage storage, ServiceHttpClient internal) {
        this.properties = properties; this.policy = policy; this.provider = provider;
        this.storage = storage; this.internal = internal;
    }
    public Health health() {
        if (!policy.enabled()) return Health.up().withDetail("generationEnabled", false).build();
        List<String> missing = new ArrayList<>();
        if (properties.apiKey().isBlank()) missing.add("CAKE_AI_API_KEY");
        if (properties.firebaseProjectId().isBlank()) missing.add("CAKE_AI_FIREBASE_PROJECT_ID");
        if (properties.firebaseBucket().isBlank()) missing.add("CAKE_AI_FIREBASE_BUCKET");
        if (internal.properties().clientSecret() == null || internal.properties().clientSecret().isBlank()) missing.add("SERVICE_CLIENT_SECRET");
        if (!missing.isEmpty()) return Health.down().withDetail("missing", missing).build();
        try {
            provider.checkAvailable(); storage.checkAvailable();
            internal.serviceToken("marketplace-service", "marketplace:request:read");
            return Health.up().withDetail("provider", "GOOGLE_GEMINI").withDetail("storage", "GCS").build();
        } catch (RuntimeException error) {
            return Health.down().withDetail("reason", "CAKE_AI_DEPENDENCY_UNAVAILABLE").build();
        }
    }
}
