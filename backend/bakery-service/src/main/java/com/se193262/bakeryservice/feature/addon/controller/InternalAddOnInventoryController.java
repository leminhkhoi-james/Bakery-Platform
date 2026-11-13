package com.se193262.bakeryservice.feature.addon.controller;

import com.se193262.bakeryservice.feature.addon.service.AddOnInventoryService;
import com.se193262.bakeryservice.feature.addon.service.AddOnInventoryService.AllocationRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/bakeries/{bakeryId}/inventory/orders/{orderId}")
public class InternalAddOnInventoryController {
    private final AddOnInventoryService inventory;
    public InternalAddOnInventoryController(AddOnInventoryService inventory) { this.inventory = inventory; }

    @PostMapping("/allocate")
    public ResponseEntity<Void> allocate(@PathVariable UUID bakeryId, @PathVariable UUID orderId,
            @Valid @RequestBody AllocationRequest request) {
        inventory.allocate(bakeryId, orderId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/release")
    public ResponseEntity<Void> release(@PathVariable UUID bakeryId, @PathVariable UUID orderId) {
        inventory.release(bakeryId, orderId);
        return ResponseEntity.noContent().build();
    }
}
