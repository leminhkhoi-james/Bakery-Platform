package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.platform.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DesignController {
    public enum ModerationStatus { APPROVED, REJECTED }
    public record ModerateDesignRequest(@NotNull ModerationStatus moderationStatus) {}
    private final DesignService service;
    public DesignController(DesignService service) { this.service = service; }

    @GetMapping("/generated-designs/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ApiResponse<GeneratedDesignResponse> get(@PathVariable UUID id) {
        return ApiResponse.success(service.get(id));
    }

    @PatchMapping("/admin/generated-designs/{id}/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GeneratedDesignResponse> moderate(@PathVariable UUID id,
            @Valid @RequestBody ModerateDesignRequest request) {
        return ApiResponse.success(service.moderate(id, request.moderationStatus().name()));
    }
}
