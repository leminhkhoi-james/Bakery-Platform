package com.se193262.bakeryservice.feature.bakery.controller;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.ChangeBakeryStatusRequest;
import com.se193262.bakeryservice.feature.bakery.dto.AdminBakeryDetailResponse;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.feature.bakery.service.AdminBakeryService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import com.se193262.bakeryservice.shared.dto.PageResult;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/bakeries")
public class AdminBakeryController {
    private final BakeryService bakeryService;
    private final AdminBakeryService adminBakeryService;

    public AdminBakeryController(BakeryService bakeryService, AdminBakeryService adminBakeryService) {
        this.bakeryService = bakeryService;
        this.adminBakeryService = adminBakeryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<BakeryDto>>> list(
            @RequestParam(required = false) BakeryStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(bakeryService.listForAdmin(status, query, city, page, size)));
    }

    @GetMapping("/{bakeryId}")
    public ResponseEntity<ApiResponse<AdminBakeryDetailResponse>> get(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(adminBakeryService.detail(bakeryId)));
    }

    @PatchMapping("/{bakeryId}/status")
    public ResponseEntity<ApiResponse<BakeryDto>> changeStatus(@PathVariable UUID bakeryId,
            @Valid @RequestBody ChangeBakeryStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(bakeryService.changeStatus(bakeryId, request.status())));
    }
}
