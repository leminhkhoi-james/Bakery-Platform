package com.se193262.identityservice.feature.address;

import com.se193262.identityservice.feature.address.dto.*;
import com.se193262.identityservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
public class AddressController {
    private final AddressService service;
    public AddressController(AddressService service) { this.service = service; }

    @GetMapping
    public ApiResponse<List<AddressResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(service.list(actor(jwt)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AddressResponse> get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ApiResponse.success(service.get(actor(jwt), id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> create(@AuthenticationPrincipal Jwt jwt,
            @Validated(SaveAddressRequest.Create.class) @RequestBody SaveAddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.create(actor(jwt), request)));
    }

    @PatchMapping("/{id}")
    public ApiResponse<AddressResponse> update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @Valid @RequestBody SaveAddressRequest request) {
        return ApiResponse.success(service.update(actor(jwt), id, request));
    }

    @PutMapping("/{id}/default")
    public ApiResponse<AddressResponse> setDefault(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ApiResponse.success(service.setDefault(actor(jwt), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(actor(jwt), id);
        return ResponseEntity.noContent().build();
    }

    private UUID actor(Jwt jwt) {
        try { return UUID.fromString(jwt.getSubject()); }
        catch (RuntimeException exception) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token subject"); }
    }
}
