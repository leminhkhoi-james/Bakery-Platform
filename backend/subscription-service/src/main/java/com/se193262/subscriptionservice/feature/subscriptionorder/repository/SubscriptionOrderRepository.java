package com.se193262.subscriptionservice.feature.subscriptionorder.repository;

import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.Collection;
import java.time.Instant;
import java.util.UUID;

public interface SubscriptionOrderRepository extends JpaRepository<SubscriptionOrder, UUID>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<SubscriptionOrder> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from SubscriptionOrder o where o.id = :id")
    Optional<SubscriptionOrder> findLockedById(@Param("id") UUID id);
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
