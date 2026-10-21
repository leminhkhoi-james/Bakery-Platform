package com.se193262.subscriptionservice.feature.subscription.controller;

import com.se193262.subscriptionservice.feature.subscription.dto.BakerySubscriptionDto;
import com.se193262.subscriptionservice.feature.subscription.service.BakerySubscriptionService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@Profile("!prod")
@RequestMapping("/api/v1/bakeries/{bakeryId}/subscription")
public class BakerySubscriptionController {
    private final BakerySubscriptionService subscriptionService;

    public BakerySubscriptionController(BakerySubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BakerySubscriptionDto>> get(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getForBakery(bakeryId)));
    }
}
