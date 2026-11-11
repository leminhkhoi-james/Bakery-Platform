package com.se193262.identityservice.feature.user;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.identityservice.feature.user.dto.ReplaceUserRolesRequest;
import com.se193262.identityservice.feature.user.dto.UpdateUserStatusRequest;
import com.se193262.identityservice.feature.user.dto.UserProfileResponse;
import com.se193262.identityservice.shared.dto.ApiResponse;
import com.se193262.identityservice.shared.dto.ResultPaginationDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
@Validated
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final UserManagementService userManagementService;

    public AdminUserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> list(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(ApiResponse.success(ResultPaginationDTO.fromPage(
                userManagementService.list(email, status, role, page, size))));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> get(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(userManagementService.get(userId)));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<UserProfileResponse>> changeStatus(
            @PathVariable UUID userId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userManagementService.changeStatus(userId, actorId(jwt), request.status())));
    }

    @PutMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<UserProfileResponse>> replaceRoles(
            @PathVariable UUID userId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ReplaceUserRolesRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userManagementService.replaceRoles(userId, actorId(jwt), request.roles())));
    }

    private UUID actorId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "The token subject is invalid");
        }
    }
}
