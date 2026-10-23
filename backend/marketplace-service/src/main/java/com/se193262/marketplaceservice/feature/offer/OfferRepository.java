package com.se193262.marketplaceservice.feature.offer;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface OfferRepository
        extends JpaRepository<Offer, UUID>, JpaSpecificationExecutor<Offer> {
    java.util.List<Offer> findTop100ByCakeRequestIdOrderByCreatedAtDesc(UUID id);

    java.util.List<Offer> findTop100ByCakeRequestIdAndBakeryIdInOrderByCreatedAtDesc(
            UUID id, java.util.Collection<UUID> bakeries);

    java.util.List<Offer> findTop100ByCakeRequestIdAndStatusAndIdNot(
            UUID id, OfferStatus status, UUID excluded);

    boolean existsByCakeRequestId(UUID id);

    java.util.List<Offer> findTop100ByStatusAndExpiresAtBefore(
            OfferStatus status, java.time.Instant now);

    boolean existsByCakeRequestIdAndBakeryId(UUID requestId, UUID bakeryId);
}
