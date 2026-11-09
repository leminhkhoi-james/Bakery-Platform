package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.platform.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DesignController {
    public enum ModerationStatus { APPROVED, REJECTED }
    public record ModerateDesignRequest(@NotNull ModerationStatus moderationStatus, @Size(max = 1000) String reason) {}
    private final DesignService service;
    public DesignController(DesignService service) { this.service = service; }

    @GetMapping("/generated-designs/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ApiResponse<GeneratedDesignResponse> get(@PathVariable UUID id) {
        return ApiResponse.success(service.get(id));
    }

    @GetMapping("/admin/generated-designs")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DesignService.DesignPage> pending(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.pending("ALL".equals(status) ? null : status, page, size));
    }

    @PatchMapping("/admin/generated-designs/{id}/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GeneratedDesignResponse> moderate(@PathVariable UUID id,
            @Valid @RequestBody ModerateDesignRequest request) {
        return ApiResponse.success(service.moderate(id, request.moderationStatus().name(), request.reason()));
    }
}
