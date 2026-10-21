package com.se193262.bakeryservice.feature.bakery.controller;

import com.se193262.bakeryservice.feature.bakery.dto.PublicBakeryResponse;
import com.se193262.bakeryservice.feature.bakery.service.PublicBakeryService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import com.se193262.bakeryservice.shared.dto.PageResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bakeries")
public class PublicBakeryController {
    private final PublicBakeryService service;

    public PublicBakeryController(PublicBakeryService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<PublicBakeryResponse>>> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.list(query, city, district, page, size)));
    }

    @GetMapping("/{bakeryId}")
    public ResponseEntity<ApiResponse<PublicBakeryResponse>> get(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(service.get(bakeryId)));
    }
}
