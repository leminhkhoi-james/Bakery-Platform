package com.se193262.subscriptionservice.feature.subscription.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.subscriptionservice.feature.subscription.dto.EntitlementResponse;
import com.se193262.subscriptionservice.feature.subscription.service.BakerySubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/internal/v1/subscriptions/bakeries")
public class InternalSubscriptionController {
    private final BakerySubscriptionService service;

    public InternalSubscriptionController(BakerySubscriptionService service) {
        this.service = service;
    }

    @GetMapping("/{bakeryId}/entitlement")
    public ResponseEntity<EntitlementResponse> entitlement(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(service.entitlement(bakeryId));
    }
}
