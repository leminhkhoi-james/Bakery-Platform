package com.se193262.subscriptionservice.feature.plan.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.subscriptionservice.feature.plan.dto.SubscriptionPlanDto;
import com.se193262.subscriptionservice.feature.plan.service.SubscriptionPlanService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/api/v1/admin/subscription-plans")
public class AdminSubscriptionPlanController {
    private final SubscriptionPlanService planService;

    public AdminSubscriptionPlanController(SubscriptionPlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> list() {
        return ResponseEntity.ok(ApiResponse.success(planService.listAdmin()));
    }

    @PostMapping
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Resource created", useReturnTypeSchema = true)
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> create(@Valid @RequestBody SubscriptionPlanDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(planService.create(request)));
    }

    @PatchMapping("/{planId}")
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> update(@PathVariable UUID planId,
            @Valid @RequestBody SubscriptionPlanDto request) {
        return ResponseEntity.ok(ApiResponse.success(planService.update(planId, request)));
    }

    @PostMapping("/{planId}/archive")
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> archive(@PathVariable UUID planId) {
        return ResponseEntity.ok(ApiResponse.success(planService.archive(planId)));
    }
}
