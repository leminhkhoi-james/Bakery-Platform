package com.se193262.marketplaceservice.feature.offer;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.UUID;

@Component
public class OfferTransitions {
    private final OfferStatusHistoryRepository history;
    private final Clock clock;
    private final OfferRepository offers;

    public OfferTransitions(
            OfferStatusHistoryRepository history, Clock clock, OfferRepository offers) {
        this.history = history;
        this.clock = clock;
        this.offers = offers;
    }

    public void change(Offer offer, OfferStatus status, UUID actor, String reason) {
        var record = OfferStatusHistory.create();
        record.setId(UUID.randomUUID());
        record.setOfferId(offer.getId());
        record.setFromStatus(
                offer.getStatus() == null || "Submitted".equals(reason)
                        ? null
                        : offer.getStatus().name());
        record.setToStatus(status.name());
        record.setChangedBy(actor);
        record.setReason(reason);
        record.setChangedAt(clock.instant());
        offer.setStatus(status);
        offer.setUpdatedAt(clock.instant());
        history.save(record);
    }

    public void pendingTo(
            UUID requestId, UUID except, OfferStatus status, UUID actor, String reason) {
        while (true) {
            var batch =
                    offers.findTop100ByCakeRequestIdAndStatusAndIdNot(
                            requestId,
                            OfferStatus.PENDING,
                            except == null ? new UUID(0, 0) : except);
            if (batch.isEmpty()) return;
            batch.forEach(offer -> change(offer, status, actor, reason));
            offers.flush();
        }
    }
}
