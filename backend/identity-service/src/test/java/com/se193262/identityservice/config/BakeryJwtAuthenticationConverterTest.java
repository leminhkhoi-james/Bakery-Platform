package com.se193262.identityservice.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BakeryJwtAuthenticationConverterTest {

    @Test
    @DisplayName("Map platform roles và OAuth scopes sang namespace authority riêng")
    void convert_rolesAndScopes_mapsAuthorities() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("subject")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .claim("roles", List.of("CUSTOMER", "ADMIN"))
                .claim("scope", "identity:user:read identity:address:read")
                .build();

        var authentication = new BakeryJwtAuthenticationConverter().convert(jwt);

        assertEquals("subject", authentication.getName());
        assertTrue(authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")));
        assertTrue(authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("SCOPE_identity:user:read")));
    }
}
