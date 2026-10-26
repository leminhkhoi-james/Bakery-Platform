package com.se193262.cakeaiservice.feature.design;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/internal/v1")
@PreAuthorize("hasAuthority('SCOPE_cake-ai:design:validate')")
public class DesignValidationController {
    private final DesignValidationService service;

    public DesignValidationController(DesignValidationService service) {
        this.service = service;
    }

    @GetMapping("/generated-designs/{id}/validation")
    public Map<String, Object> validate(
            @PathVariable UUID id,
            @RequestParam UUID customerId,
            @RequestParam UUID cakeRequestId) {
        return service.validate(id, customerId, cakeRequestId);
    }

    @GetMapping("/cake-requests/{id}/generation-context")
    public Map<String, Boolean> context(@PathVariable UUID id) {
        return service.context(id);
    }
}
