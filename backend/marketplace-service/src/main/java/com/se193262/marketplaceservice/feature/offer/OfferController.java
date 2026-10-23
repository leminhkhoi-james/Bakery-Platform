package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.shared.dto.*;
import com.se193262.platform.dto.ApiResponse;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class OfferController {
    private final OfferService service;
    private final OfferAcceptanceService acceptance;

    public OfferController(OfferService service, OfferAcceptanceService acceptance) {
        this.service = service;
        this.acceptance = acceptance;
    }

    @GetMapping("/offers")
    public ApiResponse<PageResponse<OfferResponse>> list(
            @RequestParam Map<String, String> filters) {
        return ApiResponse.success(service.list(filters));
    }

    @GetMapping("/offers/{id}")
    public ApiResponse<OfferResponse> detail(@PathVariable UUID id) {
        return ApiResponse.success(service.detail(id));
    }

    @PostMapping("/cake-requests/{id}/offers")
    public ResponseEntity<ApiResponse<OfferResponse>> create(
            @PathVariable UUID id, @Valid @RequestBody CreateOfferRequest command) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(id, command)));
    }

    @PatchMapping("/offers/{id}")
    public ApiResponse<OfferResponse> patch(
            @PathVariable UUID id, @Valid @RequestBody PatchOfferRequest command) {
        return ApiResponse.success(service.patch(id, command));
    }

    @PostMapping("/offers/{id}/withdraw")
    public ApiResponse<OfferResponse> withdraw(
            @PathVariable UUID id, @Valid @RequestBody ReasonRequest command) {
        return ApiResponse.success(service.withdraw(id, command.reason()));
    }

    @PostMapping("/offers/{id}/accept")
    public ApiResponse<AcceptanceResponse> accept(
            @PathVariable UUID id,
            @RequestHeader(value = "Idempotency-Key", required = false) String key,
            @Valid @RequestBody AcceptOfferRequest command) {
        return ApiResponse.success(acceptance.accept(id, key, command));
    }
}
