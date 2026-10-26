package com.se193262.subscriptionservice.feature.plan.repository;

import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {
    List<SubscriptionPlan> findAllByStatusOrderByMonthlyPriceAsc(PlanStatus status);
    Optional<SubscriptionPlan> findByIdAndStatus(UUID id, PlanStatus status);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, UUID id);
}
