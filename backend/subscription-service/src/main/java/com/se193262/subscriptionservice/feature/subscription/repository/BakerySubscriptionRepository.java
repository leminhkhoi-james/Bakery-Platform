package com.se193262.subscriptionservice.feature.subscription.repository;

import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface BakerySubscriptionRepository extends JpaRepository<BakerySubscription, UUID> {
    List<BakerySubscription> findAllByBakeryIdAndStatusInOrderByPeriodStartAsc(
            UUID bakeryId, Collection<SubscriptionStatus> statuses);
    Optional<BakerySubscription> findBySourceOrder_Id(UUID orderId);
    List<BakerySubscription> findAllByBakeryIdOrderByPeriodStartDesc(UUID bakeryId);
    List<BakerySubscription> findAllByStatusAndPeriodStartLessThanEqual(
            SubscriptionStatus status, java.time.Instant now);
    List<BakerySubscription> findAllByStatusAndPeriodEndLessThanEqual(
            SubscriptionStatus status, java.time.Instant now);
    @Query(value = "SELECT pg_try_advisory_xact_lock(hashtextextended(CAST(:bakeryId AS text), 0))", nativeQuery = true)
    boolean tryLockBakery(@Param("bakeryId") UUID bakeryId);
}
