package com.se193262.subscriptionservice.feature.subscriptionorder.controller;

import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SubscriptionOrderController {
    private final SubscriptionOrderService orderService;

    public SubscriptionOrderController(SubscriptionOrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/bakeries/{bakeryId}/subscription-orders")
    public ResponseEntity<ApiResponse<SubscriptionOrderDto>> create(@PathVariable UUID bakeryId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody SubscriptionOrderDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(orderService.create(bakeryId,
                        UUID.fromString(jwt.getSubject()), idempotencyKey, request)));
    }

    @GetMapping("/bakeries/{bakeryId}/subscription-orders")
    public ResponseEntity<ApiResponse<PageResult<SubscriptionOrderDto>>> list(@PathVariable UUID bakeryId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) SubscriptionOrderStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ResponseEntity.ok(ApiResponse.success(orderService.list(bakeryId,
                UUID.fromString(jwt.getSubject()), jwt.getClaimAsStringList("roles") != null
                        && jwt.getClaimAsStringList("roles").contains("ADMIN"), status, page, size, sort)));
    }

    @GetMapping("/subscription-orders/{orderId}")
    public ResponseEntity<ApiResponse<SubscriptionOrderDto>> get(@PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(orderService.get(orderId,
                UUID.fromString(jwt.getSubject()), jwt.getClaimAsStringList("roles") != null
                        && jwt.getClaimAsStringList("roles").contains("ADMIN"))));
    }
}
