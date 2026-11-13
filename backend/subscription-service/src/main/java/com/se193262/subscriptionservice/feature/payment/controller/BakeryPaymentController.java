package com.se193262.subscriptionservice.feature.payment.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

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
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/api/v1/subscription-orders/{orderId}/payments")
public class BakeryPaymentController {
    private final BakeryPaymentService paymentService;

    public BakeryPaymentController(BakeryPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping(consumes = "multipart/form-data")
    @io.swagger.v3.oas.annotations.Operation(summary = "Submit payment evidence for admin review",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
                    content = @io.swagger.v3.oas.annotations.media.Content(mediaType = "multipart/form-data",
                            encoding = @io.swagger.v3.oas.annotations.media.Encoding(name = "metadata", contentType = "application/json"))))
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Evidence submitted or idempotently replayed; not payment settlement", useReturnTypeSchema = true),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid metadata, read-only fields or idempotency key"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Order state or idempotency conflict"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "415", description = "Metadata part must be application/json"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Payment amount, method or evidence is invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "Proof storage unavailable")
    })
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
