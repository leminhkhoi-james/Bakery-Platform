package com.se193262.orderservice.infrastructure.client;

import java.util.UUID;

public class MarketplaceServiceClient {

    private final MarketplaceClient delegate;
    private final RemoteClientExecutor executor = new RemoteClientExecutor("Marketplace Service");

    public MarketplaceServiceClient(MarketplaceClient delegate) {
        this.delegate = delegate;
    }

    public MarketplaceClient.AcceptedOfferOrderSourceResponse getAcceptedOfferOrderSource(UUID offerId) {
        return executor.execute(() -> delegate.getAcceptedOfferOrderSource(offerId));
    }
}