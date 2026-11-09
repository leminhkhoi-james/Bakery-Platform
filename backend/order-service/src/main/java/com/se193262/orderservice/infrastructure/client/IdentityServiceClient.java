package com.se193262.orderservice.infrastructure.client;

import java.util.UUID;

public class IdentityServiceClient {

    private final IdentityClient delegate;
    private final RemoteClientExecutor executor = new RemoteClientExecutor("Identity Service");

    public IdentityServiceClient(IdentityClient delegate) {
        this.delegate = delegate;
    }

    public IdentityClient.UserResponse getUser(UUID userId) {
        return executor.execute(() -> delegate.getUser(userId));
    }

    public IdentityClient.AddressResponse getAddress(UUID userId, UUID addressId) {
        try {
            return executor.execute(() -> delegate.getAddress(userId, addressId));
        } catch (RemoteServiceException exception) {
            if (Integer.valueOf(404).equals(exception.getRemoteStatus())) {
                // Identity deliberately hides foreign/deleted addresses behind 404.
                throw new com.se193262.orderservice.feature.order.InvalidOrderRequestException(
                        "Delivery address is unavailable for this customer");
            }
            throw exception;
        }
    }
}
