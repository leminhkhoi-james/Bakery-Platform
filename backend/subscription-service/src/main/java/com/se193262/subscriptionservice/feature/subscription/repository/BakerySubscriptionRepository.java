package com.se193262.subscriptionservice.feature.subscription.repository;

import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface BakerySubscriptionRepository extends JpaRepository<BakerySubscription, UUID> {
    List<BakerySubscription> findAllByBakeryIdAndStatusInOrderByPeriodStartAsc(
            UUID bakeryId, Collection<SubscriptionStatus> statuses);
    Optional<BakerySubscription> findBySourceOrder_Id(UUID orderId);
}
