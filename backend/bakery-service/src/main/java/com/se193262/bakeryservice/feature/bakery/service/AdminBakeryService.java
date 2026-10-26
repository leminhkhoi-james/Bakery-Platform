package com.se193262.bakeryservice.feature.bakery.service;

import com.se193262.bakeryservice.feature.bakery.dto.AdminBakeryDetailResponse;
import com.se193262.bakeryservice.feature.member.service.BakeryMemberService;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import com.se193262.bakeryservice.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AdminBakeryService {
    private final BakeryService bakeryService;
    private final BakeryMemberService memberService;
    private final SubscriptionEntitlementClient entitlementClient;

    public AdminBakeryService(BakeryService bakeryService, BakeryMemberService memberService,
            SubscriptionEntitlementClient entitlementClient) {
        this.bakeryService = bakeryService;
        this.memberService = memberService;
        this.entitlementClient = entitlementClient;
    }

    public AdminBakeryDetailResponse detail(UUID bakeryId) {
        var bakery = bakeryService.get(bakeryId);
        var members = memberService.list(bakeryId);
        AdminBakeryDetailResponse.SubscriptionSummary subscription;
        try {
            var entitlement = entitlementClient.getEntitlement(bakeryId);
            subscription = new AdminBakeryDetailResponse.SubscriptionSummary(
                    entitlement.active(), entitlement.planCode(), entitlement.periodEnd(),
                    entitlement.features());
        } catch (AppException exception) {
            if (exception.getStatus() != HttpStatus.SERVICE_UNAVAILABLE) throw exception;
            subscription = null;
        }
        return new AdminBakeryDetailResponse(bakery, members, subscription);
    }
}
