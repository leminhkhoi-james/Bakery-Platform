package com.se193262.bakeryservice.feature.bakery.controller;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryInternalProfileResponse;
import com.se193262.bakeryservice.feature.bakery.service.BakeryInternalService;
import com.se193262.bakeryservice.feature.member.dto.BakeryAuthorizationResponse;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/bakeries")
public class InternalBakeryController {
    private final BakeryInternalService service;

    public InternalBakeryController(BakeryInternalService service) {
        this.service = service;
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
