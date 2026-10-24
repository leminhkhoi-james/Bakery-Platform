package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.offer.OfferRepository;
import com.se193262.marketplaceservice.feature.offer.OfferStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketplaceChatAuthorizationServiceTest {

    private final CakeRequestRepository requests = mock(CakeRequestRepository.class);
    private final OfferRepository offers = mock(OfferRepository.class);
    private final MarketplaceChatAuthorizationService service =
            new MarketplaceChatAuthorizationService(
                    requests, offers, Clock.fixed(Instant.parse("2026-10-23T10:00:00Z"), ZoneOffset.UTC));

    @Test
    void authorize_openRequest_allowsCustomerAndPendingOfferBakery() {
        UUID requestId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        UUID bakeryId = UUID.randomUUID();
        when(requests.findById(requestId)).thenReturn(Optional.of(request(
                requestId, customerId, null, RequestStatus.OPEN)));
        when(offers.existsByCakeRequestIdAndBakeryIdAndStatusAndExpiresAtAfter(
                requestId, bakeryId, OfferStatus.PENDING, Instant.parse("2026-10-23T10:00:00Z")))
                .thenReturn(true);

        var response = service.authorize(requestId, customerId, bakeryId);

        assertTrue(response.authorized());
        verify(offers).existsByCakeRequestIdAndBakeryIdAndStatusAndExpiresAtAfter(
                requestId, bakeryId, OfferStatus.PENDING, Instant.parse("2026-10-23T10:00:00Z"));
    }

    @Test
    void authorize_selectedRequest_onlyAllowsAcceptedOfferBakery() {
        UUID requestId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        UUID bakeryId = UUID.randomUUID();
        when(requests.findById(requestId)).thenReturn(Optional.of(request(
                requestId, customerId, null, RequestStatus.OFFER_SELECTED)));
        when(offers.existsByCakeRequestIdAndBakeryIdAndStatus(
                requestId, bakeryId, OfferStatus.ACCEPTED)).thenReturn(true);

        var response = service.authorize(requestId, customerId, bakeryId);

        assertTrue(response.authorized());
        verify(offers).existsByCakeRequestIdAndBakeryIdAndStatus(
                requestId, bakeryId, OfferStatus.ACCEPTED);
    }

    @Test
    void authorize_rejectsWrongCustomerAndIneligibleRequestStates() {
        UUID requestId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        UUID otherCustomerId = UUID.randomUUID();
        UUID bakeryId = UUID.randomUUID();
        when(requests.findById(requestId)).thenReturn(Optional.of(request(
                requestId, customerId, bakeryId, RequestStatus.OPEN)));

        assertFalse(service.authorize(requestId, otherCustomerId, bakeryId).authorized());

        when(requests.findById(requestId)).thenReturn(Optional.of(request(
                requestId, customerId, bakeryId, RequestStatus.CANCELLED)));
        assertFalse(service.authorize(requestId, customerId, bakeryId).authorized());
    }

    private CakeRequest request(
            UUID id, UUID customerId, UUID targetBakeryId, RequestStatus status) {
        CakeRequest request = CakeRequest.create();
        request.setId(id);
        request.setCustomerId(customerId);
        request.setTargetBakeryId(targetBakeryId);
        request.setStatus(status);
        return request;
    }
}
