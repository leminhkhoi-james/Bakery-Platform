package com.se193262.marketplaceservice.infrastructure.client;

import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.*;
import com.se193262.platform.client.ServiceHttpClient;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class BakeryClient {
    private final ServiceHttpClient http;

    public BakeryClient(ServiceHttpClient http) {
        this.http = http;
    }

    public Bakery bakery(UUID id) {
        return http.get(
                http.properties().bakeryUrl(),
                "/internal/v1/bakeries/" + id,
                "bakery-service",
                "bakery:profile:read",
                Bakery.class);
    }

    public Membership membership(UUID bakeryId, UUID userId) {
        return http.get(
                http.properties().bakeryUrl(),
                "/internal/v1/bakeries/" + bakeryId + "/members/" + userId + "/authorization",
                "bakery-service",
                "bakery:membership:read",
                Membership.class);
    }

    public List<Membership> memberships(UUID userId) {
        return Arrays.asList(
                http.get(
                        http.properties().bakeryUrl(),
                        "/internal/v1/users/" + userId + "/bakery-memberships",
                        "bakery-service",
                        "bakery:membership:read",
                        Membership[].class));
    }

    public Quote quote(QuoteRequest request) {
        return http.post(
                http.properties().bakeryUrl(),
                "/internal/v1/catalog/"
                        + (request.productId() == null ? "add-on-quotes" : "customization-quotes"),
                "bakery-service",
                "bakery:catalog:quote",
                request,
                null,
                Quote.class);
    }
}
