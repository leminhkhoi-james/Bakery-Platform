package com.se193262.orderservice.infrastructure.client;

import java.util.UUID;

public class BakeryServiceClient {

    private final BakeryClient delegate;
    private final RemoteClientExecutor executor = new RemoteClientExecutor("Bakery Service");

    public BakeryServiceClient(BakeryClient delegate) {
        this.delegate = delegate;
    }

    public BakeryClient.BakeryResponse getBakery(UUID bakeryId) {
        return executor.execute(() -> delegate.getBakery(bakeryId));
    }

    public BakeryClient.MembershipAuthorizationResponse getMembershipAuthorization(
            UUID bakeryId, UUID userId, String requiredRole) {
        return executor.execute(() -> delegate.getMembershipAuthorization(bakeryId, userId, requiredRole));
    }

    public BakeryClient.CatalogQuoteResponse getCatalogQuote(BakeryClient.CatalogQuoteRequest request) {
        return executor.execute(() -> delegate.getCatalogQuote(request));
    }
}