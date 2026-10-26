package com.se193262.marketplaceservice.infrastructure.scheduler;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.feature.offer.*;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;

@Component
public class MarketplaceScheduler {
    private final OfferAcceptanceService acceptance;
    private final MarketplaceExpirationService expiration;
    private final OfferRepository offers;
    private final CakeRequestRepository requests;
    private final RequestImageService images;
    private final Clock clock;
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(MarketplaceScheduler.class);

    public MarketplaceScheduler(
            OfferAcceptanceService acceptance,
            MarketplaceExpirationService expiration,
            OfferRepository offers,
            CakeRequestRepository requests,
            RequestImageService images,
            Clock clock) {
        this.acceptance = acceptance;
        this.expiration = expiration;
        this.offers = offers;
        this.requests = requests;
        this.images = images;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${marketplace.scheduler-delay-ms:30000}")
    public void recover() {
        safe(acceptance::recover);
    }

    @Scheduled(fixedDelayString = "${marketplace.scheduler-delay-ms:30000}")
    public void expire() {
        for (var offer :
                offers.findTop100ByStatusAndExpiresAtBefore(OfferStatus.PENDING, clock.instant()))
            safe(() -> expiration.expireOffer(offer.getId()));
        for (var request :
                requests.findTop100ByStatusAndNeededAtBefore(RequestStatus.OPEN, clock.instant()))
            safe(() -> expiration.closeRequest(request.getId()));
    }

    @Scheduled(
            fixedDelayString = "${marketplace.orphan-cleanup-delay-ms:3600000}",
            initialDelayString = "${marketplace.orphan-cleanup-delay-ms:3600000}")
    public void clean() {
        safe(images::cleanOrphans);
    }

    private void safe(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException error) {
            log.warn(
                    "Marketplace scheduled operation deferred: type={}",
                    error.getClass().getSimpleName());
        }
    }
}
