package com.se193262.bakeryservice.feature.bakery.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOnboardingRequest;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.service.BakeryOnboardingService;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import com.se193262.bakeryservice.infrastructure.client.IdentityUserClient;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class BakeryOnboardingServiceImpl implements BakeryOnboardingService {
    private static final Logger log = LoggerFactory.getLogger(BakeryOnboardingServiceImpl.class);
    private final BakeryService bakeries;
    private final BakeryMemberRepository members;
    private final IdentityUserClient identity;
    private final SubscriptionEntitlementClient subscriptions;

    public BakeryOnboardingServiceImpl(BakeryService bakeries, BakeryMemberRepository members,
            IdentityUserClient identity, SubscriptionEntitlementClient subscriptions) {
        this.bakeries = bakeries;
        this.members = members;
        this.identity = identity;
        this.subscriptions = subscriptions;
    }

    @Override
    @Transactional(readOnly = true)
    public BakeryDto get(UUID customerId) {
        return members.findFirstByUserIdAndStatusOrderByJoinedAtAscIdAsc(customerId, BakeryMemberStatus.ACTIVE)
                .map(member -> bakeries.get(member.getBakery().getId()))
                .orElse(null);
    }

    @Override
    @Transactional
    public BakeryDto submit(UUID customerId, BakeryOnboardingRequest request) {
        if (!members.tryLockOnboarding(customerId)) {
            throw new AppException(HttpStatus.CONFLICT, "An onboarding request is already in progress");
        }
        BakeryDto bakery = get(customerId);
        if (bakery != null && bakery.status() != BakeryStatus.DRAFT) {
            return bakery;
        }
        BakeryDto profile = request.profile();
        BakeryDto draft = bakery == null ? bakeries.createForOnboarding(profile, customerId)
                : bakeries.update(bakery.id(), profile);
        bakeries.replaceOperations(draft.id(), request.operations());
        return bakeries.submitForApproval(draft.id());
    }

    @Override
    public void complete(UUID customerId, UUID bakeryId) {
        BakeryMember member = members.findByBakery_IdAndUserId(bakeryId, customerId)
                .filter(candidate -> candidate.getStatus() == BakeryMemberStatus.ACTIVE
                        && candidate.getMemberRole() == BakeryMemberRole.OWNER)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Active bakery owner membership is required"));
        if (bakeries.get(bakeryId).status() != BakeryStatus.ACTIVE || !subscriptions.hasActiveSubscription(bakeryId)) {
            throw new AppException(HttpStatus.CONFLICT, "Bakery approval and an active subscription are required");
        }
        grantOwner(member);
    }

    @Override
    public BakeryDto changeBakeryStatus(UUID bakeryId, BakeryStatus status) {
        BakeryDto bakery = bakeries.changeStatus(bakeryId, status);
        if (bakery.status() == BakeryStatus.ACTIVE) {
            reconcileActivation(bakeryId);
        }
        return bakery;
    }

    @Override
    public void reconcileActivation(UUID bakeryId) {
        for (BakeryMember member : members.findPendingActivations(bakeryId, BakeryStatus.ACTIVE,
                BakeryMemberStatus.ACTIVE)) {
            try {
                var roles = identity.getUser(member.getUserId()).roles();
                if (roles != null && roles.contains("BAKERY_OWNER")) {
                    members.markOwnerActivationComplete(member.getId());
                } else if (roles != null && roles.contains("CUSTOMER") && subscriptions.hasActiveSubscription(bakeryId)) {
                    grantOwner(member);
                }
            } catch (AppException failure) {
                log.warn("Owner activation for bakery {} will be retried: {}", bakeryId, failure.getMessage());
            }
        }
    }

    private void grantOwner(BakeryMember member) {
        identity.grantBakeryOwner(member.getUserId());
        members.markOwnerActivationComplete(member.getId());
    }
}
