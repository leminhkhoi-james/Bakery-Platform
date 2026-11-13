package com.se193262.orderservice.infrastructure.client;

import com.se193262.orderservice.feature.order.InvalidOrderRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.http.HttpStatus;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class IdentityServiceClientTest {
    @Test @DisplayName("An ownership-hidden or deleted address is invalid input, not an outage")
    void getAddress_notFound_isInvalidRequest() {
        IdentityClient delegate=mock(IdentityClient.class);
        UUID user=UUID.randomUUID(), address=UUID.randomUUID();
        when(delegate.getAddress(user,address)).thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND));
        assertThrows(InvalidOrderRequestException.class, () -> new IdentityServiceClient(delegate).getAddress(user,address));
    }
    @Test @DisplayName("Internal credential failures and outages remain unavailable, never address validation")
    void getAddress_internalFailures_preserveRemoteFailure() {
        for(HttpStatus status:new HttpStatus[]{HttpStatus.FORBIDDEN,HttpStatus.SERVICE_UNAVAILABLE}) {
            IdentityClient delegate=mock(IdentityClient.class);
            UUID user=UUID.randomUUID(), address=UUID.randomUUID();
            when(delegate.getAddress(user,address)).thenThrow(status.is4xxClientError()
                    ? new HttpClientErrorException(status) : new HttpServerErrorException(status));
            RemoteServiceException error=assertThrows(RemoteServiceException.class,
                    () -> new IdentityServiceClient(delegate).getAddress(user,address));
            assertEquals(status.value(),error.getRemoteStatus());
        }
    }
}
