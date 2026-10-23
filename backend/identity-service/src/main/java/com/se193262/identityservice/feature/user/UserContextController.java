package com.se193262.identityservice.feature.user;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/internal/v1/users")
public class UserContextController {
    private final UserContextService service;

    public UserContextController(UserContextService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_identity:user:read')")
    public Map<String, Object> user(@PathVariable UUID id) {
        return service.user(id);
    }

    @GetMapping("/{userId}/addresses/{addressId}")
    @PreAuthorize("hasAuthority('SCOPE_identity:address:read')")
    public Map<String, Object> address(@PathVariable UUID userId, @PathVariable UUID addressId) {
        return service.address(userId, addressId);
    }
}
