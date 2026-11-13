package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.cakerequest.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
public class MarketplaceExpirationService {
    private final OfferRepository offers;
    private final CakeRequestRepository requests;
    private final MarketplaceAccess access;
    private final OfferTransitions transitions;
    private final CakeRequestData data;
    private final Clock clock;

    public MarketplaceExpirationService(
            OfferRepository offers,
            CakeRequestRepository requests,
            MarketplaceAccess access,
            OfferTransitions transitions,
            CakeRequestData data,
            Clock clock) {
        this.offers = offers;
        this.requests = requests;
        this.access = access;
        this.transitions = transitions;
        this.data = data;
        this.clock = clock;
    }

    @Transactional
    public void expireOffer(UUID id) {
        var offer = offers.findById(id).orElseThrow();
        var request = requests.findById(offer.getCakeRequestId()).orElseThrow();
        access.mutable(request);
        if (offer.getStatus() == OfferStatus.PENDING
                && !offer.getExpiresAt().isAfter(clock.instant())) {
            access.touch(request, clock.instant());
            transitions.change(
                    offer, OfferStatus.EXPIRED, request.getCustomerId(), "Offer expired");
        }
    }

    @Transactional
    public void closeRequest(UUID id) {
        var request = requests.findById(id).orElseThrow();
        access.mutable(request);
        if (request.getStatus() != RequestStatus.OPEN
                || request.getNeededAt().isAfter(clock.instant())) return;
        request.setStatus(RequestStatus.CLOSED);
        access.touch(request, clock.instant());
        data.history(
                request,
                RequestStatus.OPEN,
                request.getCustomerId(),
                "Required delivery time passed",
                clock.instant());
        transitions.pendingTo(
                id, null, OfferStatus.EXPIRED, request.getCustomerId(), "Request closed");
    }
}
