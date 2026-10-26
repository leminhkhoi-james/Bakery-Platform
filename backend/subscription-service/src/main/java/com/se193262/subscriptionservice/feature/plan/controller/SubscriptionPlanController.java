package com.se193262.subscriptionservice.feature.plan.controller;

import com.se193262.subscriptionservice.feature.plan.dto.SubscriptionPlanDto;
import com.se193262.subscriptionservice.feature.plan.service.SubscriptionPlanService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscription-plans")
public class SubscriptionPlanController {
    private final SubscriptionPlanService planService;

    public SubscriptionPlanController(SubscriptionPlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> list() {
        return ResponseEntity.ok(ApiResponse.success(planService.listPublic()));
    }

    @GetMapping("/{planId}")
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> get(@PathVariable UUID planId) {
        return ResponseEntity.ok(ApiResponse.success(planService.getPublic(planId)));
    }
}
