package com.se193262.subscriptionservice.feature.payment.controller;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscription-orders/{orderId}/payments")
public class BakeryPaymentController {
    private final BakeryPaymentService paymentService;

    public BakeryPaymentController(BakeryPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<BakeryPaymentDto>> submit(@PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestPart("metadata") BakeryPaymentDto request,
            @RequestPart(value = "proof", required = false) MultipartFile proof) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                paymentService.submit(orderId, UUID.fromString(jwt.getSubject()), idempotencyKey, request,
                        proof)));
    }
}
