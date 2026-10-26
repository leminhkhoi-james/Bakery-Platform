package com.se193262.marketplaceservice.feature.offer;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface OfferItemRepository
        extends JpaRepository<OfferItem, UUID>, JpaSpecificationExecutor<OfferItem> {
    java.util.List<OfferItem> findByOfferIdOrderByIdAsc(UUID id);

    void deleteByOfferId(UUID id);
}
