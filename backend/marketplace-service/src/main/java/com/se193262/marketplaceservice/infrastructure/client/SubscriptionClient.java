package com.se193262.marketplaceservice.infrastructure.client;

import com.se193262.platform.client.ServiceHttpClient;

import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;

@Component
public class SubscriptionClient {
    public record Entitlement(UUID bakeryId, boolean active, Instant periodEnd) {}

    private record Cached(Entitlement entitlement, Instant expires) {}

    private final ServiceHttpClient http;
    private final Clock clock;
    private final Map<UUID, Cached> cache = new java.util.concurrent.ConcurrentHashMap<>();

    public SubscriptionClient(ServiceHttpClient http, Clock clock) {
        this.http = http;
        this.clock = clock;
    }

    public boolean active(UUID bakeryId) {
        Instant now = clock.instant();
        var cached = cache.get(bakeryId);
        if (cached != null && now.isBefore(cached.expires())) return cached.entitlement().active();
        var value =
                http.get(
                        http.properties().subscriptionUrl(),
                        "/internal/v1/subscriptions/bakeries/" + bakeryId + "/entitlement",
                        "subscription-service",
                        "subscription:entitlement:read",
                        Entitlement.class);
        Instant expires = now.plusSeconds(60);
        if (value.periodEnd() != null && value.periodEnd().isBefore(expires))
            expires = value.periodEnd();
        if (cache.size() > 10000) cache.clear();
        cache.put(bakeryId, new Cached(value, expires));
        return value.active() && value.periodEnd() != null && now.isBefore(value.periodEnd());
    }
}
