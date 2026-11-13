package com.se193262.marketplaceservice.infrastructure.client;

import com.se193262.platform.client.ServiceHttpClient;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CakeAiClient {
    public record Design(
            UUID id,
            boolean exists,
            boolean ownerMatches,
            boolean requestMatches,
            String moderationStatus,
            String jobStatus,
            String imageUrl) {
        public Design(UUID id, boolean exists, boolean ownerMatches, boolean requestMatches,
                String moderationStatus, String jobStatus) {
            this(id, exists, ownerMatches, requestMatches, moderationStatus, jobStatus, null);
        }
    }

    public record GenerationContext(boolean hasJobs) {}

    private final ServiceHttpClient http;

    public CakeAiClient(ServiceHttpClient http) {
        this.http = http;
    }

    public Design validate(UUID design, UUID customer, UUID request) {
        return validate(design, customer, request, false);
    }

    public Design validate(UUID design, UUID customer, UUID request, boolean includeImage) {
        return http.get(
                http.properties().cakeAiUrl(),
                "/internal/v1/generated-designs/"
                        + design
                        + "/validation?customerId="
                        + customer
                        + "&cakeRequestId="
                        + request
                        + (includeImage ? "&includeImage=true" : ""),
                "cake-ai-service",
                "cake-ai:design:validate",
                Design.class);
    }

    public boolean hasJobs(UUID request) {
        return http.get(
                        http.properties().cakeAiUrl(),
                        "/internal/v1/cake-requests/" + request + "/generation-context",
                        "cake-ai-service",
                        "cake-ai:design:validate",
                        GenerationContext.class)
                .hasJobs();
    }
}
