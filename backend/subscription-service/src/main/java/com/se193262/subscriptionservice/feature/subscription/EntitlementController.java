package com.se193262.subscriptionservice.feature.subscription;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/internal/v1/subscriptions")
public class EntitlementController {
    private final EntitlementService service;

    public EntitlementController(EntitlementService service) {
        this.service = service;
    }

    @GetMapping("/bakeries/{bakeryId}/entitlement")
    @PreAuthorize("hasAuthority('SCOPE_subscription:entitlement:read')")
    public Map<String, Object> entitlement(@PathVariable UUID bakeryId) {
        return service.entitlement(bakeryId);
    }
}
