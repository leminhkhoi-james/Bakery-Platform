package com.se193262.subscriptionservice.feature.subscriptionorder.repository;

import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Collection;
import java.time.Instant;
import java.util.UUID;

public interface SubscriptionOrderRepository extends JpaRepository<SubscriptionOrder, UUID> {
    Optional<SubscriptionOrder> findByOrderNumber(String orderNumber);
    boolean existsByPlan_Id(UUID planId);
    boolean existsByBakeryIdAndStatus(UUID bakeryId, SubscriptionOrderStatus status);
    boolean existsByBakeryIdAndStatusInAndExpiresAtAfter(UUID bakeryId,
            Collection<SubscriptionOrderStatus> statuses, Instant now);
    Page<SubscriptionOrder> findAllByBakeryId(UUID bakeryId, Pageable pageable);
    Page<SubscriptionOrder> findAllByBakeryIdAndStatus(UUID bakeryId, SubscriptionOrderStatus status,
                                                      Pageable pageable);
    java.util.List<SubscriptionOrder> findAllByStatusAndExpiresAtLessThanEqual(
            SubscriptionOrderStatus status, Instant now);
}
