package com.se193262.orderservice.infrastructure.client;

import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.function.Supplier;

final class RemoteClientExecutor {

    private final String serviceName;

    RemoteClientExecutor(String serviceName) {
        this.serviceName = serviceName;
    }

    <T> T execute(Supplier<T> request) {
        try {
            return request.get();
        } catch (RestClientResponseException exception) {
            throw new RemoteServiceException(serviceName, exception.getStatusCode().value(), exception);
        } catch (RestClientException exception) {
            throw new RemoteServiceException(serviceName, null, exception);
        }
    }
}