package com.se193262.orderservice.infrastructure.client;

import com.se193262.orderservice.feature.order.InvalidOrderRequestException;
import com.se193262.orderservice.feature.order.OrderConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BakeryServiceClientTest {
    private final BakeryClient.CatalogQuoteRequest request = new BakeryClient.CatalogQuoteRequest(
            UUID.randomUUID(),UUID.randomUUID(),1,List.of(),List.of(),"QA District","QA City");

    @Test @DisplayName("Unknown catalog resources and unsupported configurations are invalid orders")
    void getQuote_invalidResource_preservesValidationMeaning() {
        for(HttpStatus status:new HttpStatus[]{HttpStatus.NOT_FOUND,HttpStatus.UNPROCESSABLE_ENTITY}) {
            BakeryClient delegate=mock(BakeryClient.class);
            when(delegate.getCatalogQuote(request)).thenThrow(new HttpClientErrorException(status));
            assertThrows(InvalidOrderRequestException.class, () -> new BakeryServiceClient(delegate).getCatalogQuote(request));
        }
    }
    @Test @DisplayName("A no-longer-public product is a business conflict")
    void getQuote_catalogConflict_isConflict() {
        BakeryClient delegate=mock(BakeryClient.class);
        when(delegate.getCatalogQuote(request)).thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT));
        assertThrows(OrderConflictException.class, () -> new BakeryServiceClient(delegate).getCatalogQuote(request));
    }
    @Test @DisplayName("Credential failures and remote outages remain service failures")
    void getQuote_technicalFailure_isUnavailable() {
        for(HttpStatus status:new HttpStatus[]{HttpStatus.FORBIDDEN,HttpStatus.SERVICE_UNAVAILABLE}) {
            BakeryClient delegate=mock(BakeryClient.class);
            when(delegate.getCatalogQuote(request)).thenThrow(status.is4xxClientError()
                    ? new HttpClientErrorException(status) : new HttpServerErrorException(status));
            assertThrows(RemoteServiceException.class, () -> new BakeryServiceClient(delegate).getCatalogQuote(request));
        }
    }
}
