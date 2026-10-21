package com.se193262.subscriptionservice.feature.plan.dto;

import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record SubscriptionPlanDto(
        UUID id,
        @Size(max = 50) String code,
        @Size(max = 120) String name,
        String description,
        @DecimalMin("0.00") BigDecimal monthlyPrice,
        @Size(min = 3, max = 3) String currency,
        @Positive Integer billingPeriodMonths,
        PlanStatus status,
        Map<String, String> features
) {
    public static SubscriptionPlanDto fromEntity(SubscriptionPlan plan) {
        return new SubscriptionPlanDto(plan.getId(), plan.getCode(), plan.getName(),
                plan.getDescription(), plan.getMonthlyPrice(), plan.getCurrency(),
                plan.getBillingPeriodMonths(), plan.getStatus(), Map.copyOf(plan.getFeatures()));
    }
}
