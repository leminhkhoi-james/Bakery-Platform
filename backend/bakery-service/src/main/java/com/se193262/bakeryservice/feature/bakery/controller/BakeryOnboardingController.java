package com.se193262.bakeryservice.feature.bakery.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOnboardingRequest;
import com.se193262.bakeryservice.feature.bakery.service.BakeryOnboardingService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/api/v1/bakeries")
public class BakeryOnboardingController {
    private final BakeryOnboardingService onboarding;

    public BakeryOnboardingController(BakeryOnboardingService onboarding) {
        this.onboarding = onboarding;
    }

    @GetMapping("/onboarding")
    public ApiResponse<BakeryDto> get(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(onboarding.get(UUID.fromString(jwt.getSubject())));
    }

    @PostMapping("/onboarding")
    public ApiResponse<BakeryDto> submit(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BakeryOnboardingRequest request) {
        return ApiResponse.success(onboarding.submit(UUID.fromString(jwt.getSubject()), request));
    }

    @PostMapping("/{bakeryId}/onboarding/complete")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "No content", content = @io.swagger.v3.oas.annotations.media.Content)
    public ResponseEntity<Void> complete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID bakeryId) {
        onboarding.complete(UUID.fromString(jwt.getSubject()), bakeryId);
        return ResponseEntity.noContent().build();
    }
}
