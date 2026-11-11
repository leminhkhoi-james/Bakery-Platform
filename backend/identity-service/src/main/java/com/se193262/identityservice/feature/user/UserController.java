package com.se193262.identityservice.feature.user;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.identityservice.feature.user.dto.UpdateMyProfileRequest;
import com.se193262.identityservice.feature.user.dto.UserProfileResponse;
import com.se193262.identityservice.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateMyProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userManagementService.updateMyProfile(actorId(jwt), request)));
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
