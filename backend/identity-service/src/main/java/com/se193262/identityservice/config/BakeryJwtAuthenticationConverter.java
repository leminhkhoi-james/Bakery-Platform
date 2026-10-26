package com.se193262.identityservice.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

final class BakeryJwtAuthenticationConverter implements Converter<Jwt, JwtAuthenticationToken> {

    @Override
    public JwtAuthenticationToken convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles != null) {
            roles.stream()
                    .filter(role -> role != null && !role.isBlank())
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .forEach(authorities::add);
        }

        String scope = jwt.getClaimAsString("scope");
        if (scope != null) {
            for (String value : scope.trim().split("\\s+")) {
                if (!value.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority("SCOPE_" + value));
                }
            }
        }
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }
}
