package com.se193262.platform.security;

import com.se193262.platform.exception.BusinessException;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.*;

public record Actor(UUID id, Set<String> roles) {
    public boolean admin() {
        return roles.contains("ROLE_ADMIN");
    }

    public boolean customer() {
        return roles.contains("ROLE_CUSTOMER");
    }

    public boolean bakery() {
        return roles.contains("ROLE_BAKERY_OWNER");
    }

    public static Actor current() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken token)
                || !"user".equals(token.getToken().getClaimAsString("token_type")))
            throw BusinessException.forbidden();
        return new Actor(
                UUID.fromString(token.getToken().getSubject()),
                auth.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .collect(java.util.stream.Collectors.toSet()));
    }
}
