package com.se193262.identityservice.feature.authentication;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/v1/auth")
public class ServiceTokenController {
    private final ServiceTokenService service;

    public ServiceTokenController(ServiceTokenService service) {
        this.service = service;
    }

    @PostMapping("/service-token")
    public ServiceTokenResponse issue(@Valid @RequestBody ServiceTokenRequest request) {
        return service.issue(request);
    }
}
