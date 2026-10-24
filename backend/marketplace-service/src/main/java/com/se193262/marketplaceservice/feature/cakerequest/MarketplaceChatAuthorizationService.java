package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.ChatAuthorizationResponse;
import com.se193262.marketplaceservice.feature.offer.OfferRepository;
import com.se193262.marketplaceservice.feature.offer.OfferStatus;
import com.se193262.platform.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
public class MarketplaceChatAuthorizationService {

    private final CakeRequestRepository requests;
    private final OfferRepository offers;
    private final Clock clock;

    public MarketplaceChatAuthorizationService(
            CakeRequestRepository requests, OfferRepository offers, Clock clock) {
        this.requests = requests;
        this.offers = offers;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ChatAuthorizationResponse authorize(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        CakeRequest request = requests.findById(cakeRequestId)
                .orElseThrow(BusinessException::missing);
        RequestStatus status = request.getStatus();
        boolean chatEligible = status != RequestStatus.DRAFT && status != RequestStatus.CANCELLED;
        boolean bakeryEligible = bakeryId.equals(request.getTargetBakeryId())
                || hasEligibleOffer(cakeRequestId, bakeryId, status);
        boolean authorized = chatEligible
                && customerId.equals(request.getCustomerId())
                && bakeryEligible;
        return new ChatAuthorizationResponse(cakeRequestId, customerId, bakeryId, status, authorized);
    }

    private boolean hasEligibleOffer(UUID cakeRequestId, UUID bakeryId, RequestStatus requestStatus) {
        return switch (requestStatus) {
            case OPEN -> offers.existsByCakeRequestIdAndBakeryIdAndStatusAndExpiresAtAfter(
                    cakeRequestId, bakeryId, OfferStatus.PENDING, clock.instant());
            case OFFER_SELECTED, CLOSED -> offers.existsByCakeRequestIdAndBakeryIdAndStatus(
                    cakeRequestId, bakeryId, OfferStatus.ACCEPTED);
            case DRAFT, CANCELLED -> false;
        };
    }
}
