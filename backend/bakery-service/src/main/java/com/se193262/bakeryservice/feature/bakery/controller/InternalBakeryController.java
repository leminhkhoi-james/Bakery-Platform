package com.se193262.bakeryservice.feature.bakery.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryInternalProfileResponse;
import com.se193262.bakeryservice.feature.bakery.service.BakeryInternalService;
import com.se193262.bakeryservice.feature.bakery.service.BakeryOnboardingService;
import com.se193262.bakeryservice.feature.member.dto.BakeryAuthorizationResponse;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/internal/v1/bakeries")
public class InternalBakeryController {
    private final BakeryInternalService service;
    private final BakeryOnboardingService onboarding;

    public InternalBakeryController(BakeryInternalService service, BakeryOnboardingService onboarding) {
        this.service = service;
        this.onboarding = onboarding;
    }

    @PutMapping("/{bakeryId}/onboarding/activate")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "No content", content = @io.swagger.v3.oas.annotations.media.Content)
    public ResponseEntity<Void> activate(@PathVariable UUID bakeryId) {
        onboarding.reconcileActivation(bakeryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bakeryId}")
    public ResponseEntity<BakeryInternalProfileResponse> profile(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(service.profile(bakeryId));
    }

    @GetMapping("/{bakeryId}/members/{userId}/authorization")
    public ResponseEntity<BakeryAuthorizationResponse> authorization(@PathVariable UUID bakeryId,
            @PathVariable UUID userId, @RequestParam(required = false) BakeryMemberRole requiredRole) {
        return ResponseEntity.ok(service.authorization(bakeryId, userId, requiredRole));
    }
}
