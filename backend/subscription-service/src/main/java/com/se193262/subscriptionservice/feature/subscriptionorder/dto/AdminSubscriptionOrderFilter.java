package com.se193262.subscriptionservice.feature.subscriptionorder.dto;

import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.Instant;
import java.util.UUID;

public record AdminSubscriptionOrderFilter(
        SubscriptionOrderStatus status, UUID bakeryId, @Size(max = 120) String query,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdFrom,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant createdTo,
        Boolean eligibleForApproval, @Min(1) Integer page, @Min(1) @Max(100) Integer size) {
    public AdminSubscriptionOrderFilter {
        page = page == null ? 1 : page;
        size = size == null ? 20 : size;
    }
}
