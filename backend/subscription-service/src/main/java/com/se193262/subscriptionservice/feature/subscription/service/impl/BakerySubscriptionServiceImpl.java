package com.se193262.subscriptionservice.feature.subscription.service.impl;

import com.se193262.subscriptionservice.feature.subscription.dto.BakerySubscriptionDto;
import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscription.service.BakerySubscriptionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BakerySubscriptionServiceImpl implements BakerySubscriptionService {
    private final BakerySubscriptionRepository subscriptionRepository;

    public BakerySubscriptionServiceImpl(BakerySubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override @Transactional(readOnly = true)
    public BakerySubscriptionDto getForBakery(UUID bakeryId) {
        List<BakerySubscription> periods = subscriptionRepository
                .findAllByBakeryIdAndStatusInOrderByPeriodStartAsc(bakeryId,
                        List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.SCHEDULED));
        Instant now = Instant.now();
        BakerySubscription current = periods.stream()
                .filter(period -> period.getStatus() == SubscriptionStatus.ACTIVE
                        && !period.getPeriodStart().isAfter(now) && period.getPeriodEnd().isAfter(now))
                .findFirst().orElse(null);
        BakerySubscription scheduled = periods.stream()
                .filter(period -> period.getStatus() == SubscriptionStatus.SCHEDULED
                        && period.getPeriodStart().isAfter(now))
                .findFirst().orElse(null);
        return new BakerySubscriptionDto(bakeryId,
                current == null ? null : BakerySubscriptionDto.Period.fromEntity(current),
                scheduled == null ? null : BakerySubscriptionDto.Period.fromEntity(scheduled),
                current == null ? Map.of() : Map.copyOf(current.getPlan().getFeatures()));
    }
}
