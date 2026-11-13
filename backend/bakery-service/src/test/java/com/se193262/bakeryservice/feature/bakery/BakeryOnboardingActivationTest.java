package com.se193262.bakeryservice.feature.bakery;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.feature.bakery.service.impl.BakeryOnboardingServiceImpl;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import com.se193262.bakeryservice.infrastructure.client.IdentityUserClient;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BakeryOnboardingActivationTest {
    private final UUID bakeryId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();

    @Mock BakeryService bakeries;
    @Mock BakeryMemberRepository members;
    @Mock BakeryMember member;
    @Mock IdentityUserClient identity;
    @Mock SubscriptionEntitlementClient subscriptions;
    @InjectMocks BakeryOnboardingServiceImpl onboarding;

    @BeforeEach
    void pendingCustomer() {
        when(members.findPendingActivations(bakeryId, BakeryStatus.ACTIVE, BakeryMemberStatus.ACTIVE))
                .thenReturn(List.of(member));
        when(member.getUserId()).thenReturn(userId);
        when(identity.getUser(userId))
                .thenReturn(new IdentityUserClient.UserProfile(userId, "Customer", "ACTIVE", List.of("CUSTOMER")));
    }

    @Test
    @DisplayName("Activation waits for an active subscription")
    void reconcile_withoutActiveSubscription_keepsActivationPending() {
        onboarding.reconcileActivation(bakeryId);

        verify(identity, never()).grantBakeryOwner(userId);
        verify(members, never()).markOwnerActivationComplete(memberId);
    }

    @Test
    @DisplayName("Activation retries a failed grant and clears pending state after success")
    void reconcile_afterIdentityFailure_retriesAndCompletesActivation() {
        when(subscriptions.hasActiveSubscription(bakeryId)).thenReturn(true);
        doThrow(new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Identity unavailable"))
                .doNothing().when(identity).grantBakeryOwner(userId);

        onboarding.reconcileActivation(bakeryId);
        verify(members, never()).markOwnerActivationComplete(memberId);

        when(member.getId()).thenReturn(memberId);
        onboarding.reconcileActivation(bakeryId);
        verify(identity, times(2)).grantBakeryOwner(userId);
        verify(members).markOwnerActivationComplete(memberId);
    }
}
