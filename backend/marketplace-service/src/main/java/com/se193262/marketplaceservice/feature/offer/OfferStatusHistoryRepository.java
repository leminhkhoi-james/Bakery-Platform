package com.se193262.marketplaceservice.feature.offer;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface OfferStatusHistoryRepository
        extends JpaRepository<OfferStatusHistory, UUID>,
                JpaSpecificationExecutor<OfferStatusHistory> {
    java.util.List<OfferStatusHistory> findTop100ByOfferIdOrderByChangedAtDesc(UUID id);

    void deleteByOfferId(UUID id);
}
