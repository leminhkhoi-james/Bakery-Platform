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
        try {
            return executor.execute(() -> delegate.getCatalogQuote(request));
        } catch (RemoteServiceException exception) {
            Integer status = exception.getRemoteStatus();
            if (Integer.valueOf(404).equals(status) || Integer.valueOf(422).equals(status)) {
                throw new com.se193262.orderservice.feature.order.InvalidOrderRequestException(
                        "Product, options or delivery area are unavailable for this order");
            }
            if (Integer.valueOf(409).equals(status)) {
                throw new com.se193262.orderservice.feature.order.OrderConflictException(
                        inventoryMessage(exception));
            }
            throw exception;
        }
    }

    private String inventoryMessage(RemoteServiceException exception) {
        if (exception.getCause() instanceof org.springframework.web.client.RestClientResponseException response) {
            try {
                String message = new tools.jackson.databind.ObjectMapper().readTree(response.getResponseBodyAsString())
                        .path("message").asText("");
                if (message.startsWith("Phụ kiện ")) return message;
            } catch (RuntimeException ignored) { /* Preserve the existing fallback for other catalog conflicts. */ }
        }
        return "Product or bakery is no longer available for ordering";
    }
}
