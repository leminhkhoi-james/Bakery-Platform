package com.se193262.bakeryservice.infrastructure.scheduler;

import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.service.BakeryOnboardingService;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class BakeryOwnerActivationJob {
    private final BakeryMemberRepository members;
    private final BakeryOnboardingService onboarding;

    public BakeryOwnerActivationJob(BakeryMemberRepository members, BakeryOnboardingService onboarding) {
        this.members = members;
        this.onboarding = onboarding;
    }

    @Scheduled(fixedDelayString = "${bakery.onboarding.retry-delay-ms:15000}", initialDelay = 5000)
    public void activatePendingOwners() {
        int page = 0;
        Slice<UUID> bakeries;
        do {
            bakeries = members.findPendingActivationBakeryIds(BakeryStatus.ACTIVE, BakeryMemberStatus.ACTIVE,
                    PageRequest.of(page++, 50));
            bakeries.forEach(onboarding::reconcileActivation);
        } while (bakeries.hasNext());
    }
}
