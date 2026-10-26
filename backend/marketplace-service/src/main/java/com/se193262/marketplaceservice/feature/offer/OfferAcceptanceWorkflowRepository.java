package com.se193262.marketplaceservice.feature.offer;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface OfferAcceptanceWorkflowRepository
        extends JpaRepository<OfferAcceptanceWorkflow, UUID>,
                JpaSpecificationExecutor<OfferAcceptanceWorkflow> {
    Optional<OfferAcceptanceWorkflow> findByCustomerIdAndIdempotencyKey(
            UUID customerId, String key);

    boolean existsByCakeRequestIdAndStatusIn(
            UUID requestId, java.util.Collection<AcceptanceStatus> statuses);

    Optional<OfferAcceptanceWorkflow> findByOfferIdAndStatusIn(
            UUID offerId, java.util.Collection<AcceptanceStatus> statuses);

    java.util.List<OfferAcceptanceWorkflow> findTop100ByStatusInAndNextRetryAtBefore(
            java.util.Collection<AcceptanceStatus> statuses, java.time.Instant now);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
            "update OfferAcceptanceWorkflow w set"
                + " w.leaseOwner=:owner,w.leaseUntil=:until,w.version=w.version+1 where w.id=:id"
                + " and w.status in :statuses and (w.leaseUntil is null or w.leaseUntil < :now)")
    int claim(
            @org.springframework.data.repository.query.Param("id") UUID id,
            @org.springframework.data.repository.query.Param("owner") UUID owner,
            @org.springframework.data.repository.query.Param("until") java.time.Instant until,
            @org.springframework.data.repository.query.Param("now") java.time.Instant now,
            @org.springframework.data.repository.query.Param("statuses")
                    java.util.Collection<AcceptanceStatus> statuses);
}
