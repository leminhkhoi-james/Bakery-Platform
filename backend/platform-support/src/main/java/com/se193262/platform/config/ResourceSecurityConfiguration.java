package com.se193262.platform.config;

import com.se193262.platform.dto.ApiResponse;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;

import tools.jackson.databind.ObjectMapper;

import java.util.*;

@Configuration
@EnableMethodSecurity
public class ResourceSecurityConfiguration {
    @Bean
    JwtDecoder jwtDecoder(SecurityProperties properties, RemoteProperties remote) {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(remote.connectTimeout());
        factory.setReadTimeout(remote.readTimeout());
        var rest = new org.springframework.web.client.RestTemplate(factory);
        var decoder = NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri()).restOperations(rest).jwsAlgorithm(SignatureAlgorithm.RS256).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(properties.issuer()), token -> {
            String type = token.getClaimAsString("token_type");
            String audience = "service".equals(type) ? properties.audience() : "user".equals(type) ? properties.userAudience() : null;
            return audience != null && token.getAudience().contains(audience) && token.getSubject() != null ? org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success() : org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(new org.springframework.security.oauth2.core.OAuth2Error("invalid_token"));
        }));
        return decoder;
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, ObjectMapper mapper) throws Exception {
        http.csrf(c -> c.disable()).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a -> a.requestMatchers("/actuator/health", "/actuator/health/**").permitAll().requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/v3/api-docs.yaml", "/swagger-ui/**", "/swagger-ui.html").permitAll().requestMatchers("/internal/v1/**").access((authentication, context) -> new AuthorizationDecision(isType(authentication.get(), "service"))).requestMatchers("/api/v1/**").access((authentication, context) -> new AuthorizationDecision(isType(authentication.get(), "user"))).anyRequest().denyAll()).oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(token -> {
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if ("user".equals(token.getClaimAsString("token_type"))) {
                List<String> roles = token.getClaimAsStringList("roles");
                if (roles != null) roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
            } else {
                String scopes = token.getClaimAsString("scope");
                if (scopes != null)
                    Arrays.stream(scopes.split(" ")).filter(s -> !s.isBlank()).forEach(s -> authorities.add(new SimpleGrantedAuthority("SCOPE_" + s)));
            }
            return new JwtAuthenticationToken(token, authorities);
        })).authenticationEntryPoint((request, response, error) -> {
            response.setStatus(401);
            response.setContentType("application/json");
            mapper.writeValue(response.getWriter(), ApiResponse.error(401, "Authentication required"));
        })).exceptionHandling(e -> e.accessDeniedHandler((request, response, error) -> {
            response.setStatus(403);
            response.setContentType("application/json");
            mapper.writeValue(response.getWriter(), ApiResponse.error(403, "Access denied"));
        }));
        return http.build();
    }

    private boolean isType(org.springframework.security.core.Authentication auth, String type) {
        return auth instanceof JwtAuthenticationToken token && type.equals(token.getToken().getClaimAsString("token_type"));
    }
}
