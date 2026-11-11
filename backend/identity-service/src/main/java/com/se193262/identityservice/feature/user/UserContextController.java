package com.se193262.identityservice.feature.user;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
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

    @PutMapping("/{id}/bakery-owner")
    @PreAuthorize("hasAuthority('SCOPE_identity:bakery-owner:grant')")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void grantBakeryOwner(@PathVariable UUID id) {
        service.grantBakeryOwner(id);
    }

    @GetMapping("/{userId}/addresses/{addressId}")
    @PreAuthorize("hasAuthority('SCOPE_identity:address:read')")
    public Map<String, Object> address(@PathVariable UUID userId, @PathVariable UUID addressId) {
        return service.address(userId, addressId);
    }
}
