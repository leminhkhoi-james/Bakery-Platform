package com.se193262.orderservice.infrastructure.client;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RemoteClientExecutorTest {

    private final RemoteClientExecutor executor = new RemoteClientExecutor("Identity Service");

    @Test
    void mapsRemoteHttpStatusToServiceException() {
        RestClientResponseException remoteFailure = new RestClientResponseException(
                "not found", HttpStatusCode.valueOf(404), "Not Found", HttpHeaders.EMPTY, null, null);

        RemoteServiceException exception = assertThrows(
                RemoteServiceException.class,
                () -> executor.execute(() -> {
                    throw remoteFailure;
                }));

        assertEquals("Identity Service", exception.getServiceName());
        assertEquals(404, exception.getRemoteStatus());
    }

    @Test
    void mapsTransportFailureWithoutRemoteStatus() {
        RemoteServiceException exception = assertThrows(
                RemoteServiceException.class,
                () -> executor.execute(() -> {
                    throw new ResourceAccessException("connection timed out");
                }));

        assertEquals("Identity Service", exception.getServiceName());
        assertNull(exception.getRemoteStatus());
    }
}