package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.dto.*;
import com.se193262.platform.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@RequestMapping("/api/v1/generation-jobs")
@PreAuthorize("hasRole('CUSTOMER')")
public class GenerationController {
    private final GenerationService service;
    public GenerationController(GenerationService service) { this.service = service; }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @io.swagger.v3.oas.annotations.Operation(summary = "Queue an owned RFQ image generation job",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
                    content = @io.swagger.v3.oas.annotations.media.Content(mediaType = "multipart/form-data",
                            encoding = @io.swagger.v3.oas.annotations.media.Encoding(name = "metadata", contentType = "application/json"))))
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "202", description = "Job accepted; generation is asynchronous", useReturnTypeSchema = true),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid metadata or parameters"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "RFQ ownership or role denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "RFQ or idempotency conflict"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "415", description = "Metadata part must be application/json"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Generation quota exceeded"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "Generation disabled or dependency unavailable")
    })
    public ResponseEntity<ApiResponse<GenerationJobResponse>> create(
            @Valid @RequestPart("metadata") CreateGenerationJobRequest request,
            @RequestPart(value = "sourceImages", required = false) List<MultipartFile> images,
            @RequestHeader("Idempotency-Key") String key) {
        return accepted(service.create(request, images, key));
    }

    @GetMapping
    public ApiResponse<GenerationReader.JobPage> list(@RequestParam(required = false) UUID cakeRequestId,
            @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.list(cakeRequestId, status, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ApiResponse<GenerationReader.JobDetail> detail(@PathVariable UUID id) {
        return ApiResponse.success(service.detail(id));
    }

    @PostMapping("/{id}/prompt-revisions")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "202", description = "Prompt revision accepted for asynchronous processing", useReturnTypeSchema = true)
    public ResponseEntity<ApiResponse<GenerationJobResponse>> revise(@PathVariable UUID id,
            @Valid @RequestBody CreatePromptRevisionRequest request, @RequestHeader("Idempotency-Key") String key) {
        return accepted(service.revise(id, request, key));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<GenerationJobResponse> cancel(@PathVariable UUID id) {
        return ApiResponse.success(service.cancel(id));
    }

    private ResponseEntity<ApiResponse<GenerationJobResponse>> accepted(GenerationJobResponse response) {
        return ResponseEntity.accepted().body(ApiResponse.accepted(response));
    }
}
