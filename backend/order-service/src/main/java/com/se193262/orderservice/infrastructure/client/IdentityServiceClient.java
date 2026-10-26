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
        return executor.execute(() -> delegate.getAddress(userId, addressId));
    }
}