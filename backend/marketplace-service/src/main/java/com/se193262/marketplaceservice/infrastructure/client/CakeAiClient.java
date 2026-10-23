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
            String jobStatus) {}

    public record GenerationContext(boolean hasJobs) {}

    private final ServiceHttpClient http;

    public CakeAiClient(ServiceHttpClient http) {
        this.http = http;
    }

    public Design validate(UUID design, UUID customer, UUID request) {
        return http.get(
                http.properties().cakeAiUrl(),
                "/internal/v1/generated-designs/"
                        + design
                        + "/validation?customerId="
                        + customer
                        + "&cakeRequestId="
                        + request,
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
