package com.se193262.bakeryservice.feature.catalog;

import com.se193262.bakeryservice.feature.catalog.dto.CatalogContracts.*;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/internal/v1")
public class CatalogController {
    private final CatalogService service;

    public CatalogController(CatalogService service) {
        this.service = service;
    }

    @GetMapping("/users/{userId}/bakery-memberships")
    @PreAuthorize("hasAuthority('SCOPE_bakery:membership:read')")
    public List<Membership> memberships(@PathVariable UUID userId) {
        return service.memberships(userId);
    }

    @PostMapping("/catalog/customization-quotes")
    @PreAuthorize("hasAuthority('SCOPE_bakery:catalog:quote')")
    public Quote quote(@Valid @RequestBody QuoteRequest request) {
        return service.quote(request, true);
    }

    @PostMapping("/catalog/add-on-quotes")
    @PreAuthorize("hasAuthority('SCOPE_bakery:catalog:quote')")
    public Quote addons(@Valid @RequestBody QuoteRequest request) {
        return service.quote(request, false);
    }
}
