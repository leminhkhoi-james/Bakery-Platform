package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.*;
import com.se193262.marketplaceservice.shared.dto.*;
import com.se193262.platform.dto.ApiResponse;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/api/v1/cake-requests")
public class CakeRequestController {
    private final CakeRequestService service;
    private final RequestImageService images;

    public CakeRequestController(CakeRequestService service, RequestImageService images) {
        this.service = service;
        this.images = images;
    }

    @GetMapping
    public ApiResponse<PageResponse<CakeRequestSummaryResponse>> list(
            @RequestParam Map<String, String> filters) {
        return ApiResponse.success(service.list(filters));
    }

    @GetMapping("/{id}")
    public ApiResponse<CakeRequestResponse> detail(@PathVariable UUID id) {
        return ApiResponse.success(service.detail(id));
    }

    @PostMapping
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Resource created", useReturnTypeSchema = true)
    public ResponseEntity<ApiResponse<CakeRequestResponse>> create(
            @Valid @RequestBody CreateCakeRequestRequest command) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(command)));
    }

    @PatchMapping("/{id}")
    public ApiResponse<CakeRequestResponse> patch(
            @PathVariable UUID id, @Valid @RequestBody PatchCakeRequestRequest command) {
        return ApiResponse.success(service.patch(id, command));
    }

    @PostMapping("/{id}/publish")
    public ApiResponse<CakeRequestResponse> publish(@PathVariable UUID id) {
        return ApiResponse.success(service.publish(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<CakeRequestResponse> cancel(
            @PathVariable UUID id, @Valid @RequestBody ReasonRequest command) {
        return ApiResponse.success(service.cancel(id, command.reason()));
    }

    @PutMapping("/{id}/selected-design")
    public ApiResponse<CakeRequestResponse> design(
            @PathVariable UUID id, @Valid @RequestBody SelectDesignRequest command) {
        return ApiResponse.success(service.selectDesign(id, command.generatedDesignId()));
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Resource created", useReturnTypeSchema = true)
    public ResponseEntity<ApiResponse<List<RequestImageResponse>>> upload(
            @PathVariable UUID id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false) List<Integer> displayOrder) {
        return ResponseEntity.status(201)
                .body(ApiResponse.created(images.upload(id, files, displayOrder)));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "No content", content = @io.swagger.v3.oas.annotations.media.Content)
    public ResponseEntity<Void> delete(@PathVariable UUID id, @PathVariable UUID imageId) {
        images.delete(id, imageId);
        return ResponseEntity.noContent().build();
    }
}
