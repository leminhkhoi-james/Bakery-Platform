package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.shared.dto.*;
import com.se193262.platform.dto.ApiResponse;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
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
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Resource created", useReturnTypeSchema = true)
    public ResponseEntity<ApiResponse<OfferResponse>> create(
            @PathVariable UUID id, @Valid @RequestBody CreateOfferRequest command) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(id, command)));
    }

    @PatchMapping("/offers/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Patch editable fields of an owned pending offer",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
                    content = @io.swagger.v3.oas.annotations.media.Content(mediaType = "application/json",
                            schema = @io.swagger.v3.oas.annotations.media.Schema(implementation = PatchOfferRequest.Fields.class),
                            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(value = "{\"cakePrice\":410000,\"message\":\"Updated quotation\"}"))))
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
