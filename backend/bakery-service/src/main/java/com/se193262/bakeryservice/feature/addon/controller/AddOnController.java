package com.se193262.bakeryservice.feature.addon.controller;

import com.se193262.bakeryservice.feature.addon.dto.AddOnDto;
import com.se193262.bakeryservice.feature.addon.service.AddOnService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Profile("!prod")
@RequestMapping("/api/v1/bakeries/{bakeryId}/add-ons")
public class AddOnController {

    private final AddOnService addOnService;

    public AddOnController(AddOnService addOnService) {
        this.addOnService = addOnService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddOnDto>>> list(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(addOnService.list(bakeryId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddOnDto>> create(@PathVariable UUID bakeryId,
            @Valid @RequestBody AddOnDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(addOnService.create(bakeryId, request)));
    }

    @PatchMapping("/{addOnId}")
    public ResponseEntity<ApiResponse<AddOnDto>> update(@PathVariable UUID bakeryId,
            @PathVariable UUID addOnId, @Valid @RequestBody AddOnDto request) {
        return ResponseEntity.ok(ApiResponse.success(addOnService.update(bakeryId, addOnId, request)));
    }

    @DeleteMapping("/{addOnId}")
    public ResponseEntity<Void> delete(@PathVariable UUID bakeryId, @PathVariable UUID addOnId) {
        addOnService.delete(bakeryId, addOnId);
        return ResponseEntity.noContent().build();
    }
}
