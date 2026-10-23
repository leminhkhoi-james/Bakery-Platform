package com.se193262.bakeryservice.feature.bakery.controller;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOperationsDto;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import com.se193262.bakeryservice.shared.dto.MediaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bakeries")
public class BakeryController {

    private final BakeryService bakeryService;

    public BakeryController(BakeryService bakeryService) {
        this.bakeryService = bakeryService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BakeryDto>> create(
            @Valid @RequestBody BakeryDto request,
            @AuthenticationPrincipal Jwt jwt) {
        BakeryDto result = bakeryService.create(request, UUID.fromString(jwt.getSubject()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(result));
    }

    @PatchMapping("/{bakeryId}")
    public ResponseEntity<ApiResponse<BakeryDto>> update(@PathVariable UUID bakeryId,
                                                          @Valid @RequestBody BakeryDto request) {
        return ResponseEntity.ok(ApiResponse.success(bakeryService.update(bakeryId, request)));
    }

    @PutMapping("/{bakeryId}/operations")
    public ResponseEntity<ApiResponse<BakeryOperationsDto>> replaceOperations(
            @PathVariable UUID bakeryId,
            @Valid @RequestBody BakeryOperationsDto request) {
        return ResponseEntity.ok(ApiResponse.success(bakeryService.replaceOperations(bakeryId, request)));
    }

    @PostMapping("/{bakeryId}/submit-for-approval")
    public ResponseEntity<ApiResponse<BakeryDto>> submitForApproval(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(bakeryService.submitForApproval(bakeryId)));
    }

    @PostMapping(value = "/{bakeryId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaResponse>> uploadLogo(@PathVariable UUID bakeryId,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(bakeryService.uploadLogo(bakeryId, file)));
    }

    @PostMapping(value = "/{bakeryId}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaResponse>> uploadCover(@PathVariable UUID bakeryId,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(bakeryService.uploadCover(bakeryId, file)));
    }
}
