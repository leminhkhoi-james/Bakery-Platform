package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.config.AuthProperties;
import com.se193262.identityservice.config.OpenApiConfig;
import com.se193262.identityservice.feature.authentication.dto.LoginRequest;
import com.se193262.identityservice.feature.authentication.dto.RegisterRequest;
import com.se193262.identityservice.feature.authentication.dto.TokenResponse;
import com.se193262.identityservice.feature.user.dto.UserProfileResponse;
import com.se193262.identityservice.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final AuthProperties authProperties;

    public AuthenticationController(AuthenticationService authenticationService, AuthProperties authProperties) {
        this.authenticationService = authenticationService;
        this.authProperties = authProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserProfileResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        UserProfileResponse response = authenticationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthenticationResult result = authenticationService.login(request);
        return tokenResponse(result, "Login successful");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(HttpServletRequest request) {
        AuthenticationResult result = authenticationService.refresh(readRefreshToken(request));
        return tokenResponse(result, "Token refreshed");
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        authenticationService.logout(readRefreshToken(request));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .body(ApiResponse.success("Logged out", null));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ApiResponse<UserProfileResponse> me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ApiResponse.success(authenticationService.getCurrentUser(userId));
    }

    private ResponseEntity<ApiResponse<TokenResponse>> tokenResponse(
            AuthenticationResult result,
            String message
    ) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        refreshCookie(result.refreshToken(), authProperties.refreshTokenTtl()).toString())
                .body(ApiResponse.success(message, result.token()));
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(authProperties.refreshCookieName(), value)
                .httpOnly(true)
                .secure(authProperties.refreshCookieSecure())
                .sameSite(authProperties.refreshCookieSameSite())
                .path(authProperties.refreshCookiePath())
                .maxAge(maxAge)
                .build();
    }

    private String readRefreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (authProperties.refreshCookieName().equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
