package com.se193262.subscriptionservice.security;

import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.UUID;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            AuthenticationEntryPoint authenticationEntryPoint,
            AccessDeniedHandler accessDeniedHandler) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                        .permitAll()
                        .requestMatchers("/internal/v1/**").denyAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/subscription-plans",
                                "/api/v1/subscription-plans/{planId}")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**").access(userRole("ADMIN"))
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/bakeries/{bakeryId}/subscription-orders",
                                "/api/v1/subscription-orders/{orderId}/payments")
                        .access(userRole("BAKERY_OWNER"))
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/bakeries/{bakeryId}/subscription",
                                "/api/v1/bakeries/{bakeryId}/subscription-orders",
                                "/api/v1/subscription-orders/{orderId}")
                        .access(userRole("BAKERY_OWNER", "BAKERY_STAFF", "ADMIN"))
                        .anyRequest().denyAll())
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler));
        return http.build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("roles");
        roles.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(roles);
        return converter;
    }

    private AuthorizationManager<RequestAuthorizationContext> userRole(String... roles) {
        return (authentication, context) -> {
            Authentication resolved = authentication.get();
            boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
                    && resolved.isAuthenticated()
                    && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
                    && isUuid(jwtAuthentication.getToken().getSubject())
                    && Arrays.stream(roles).anyMatch(role -> resolved.getAuthorities().stream()
                            .anyMatch(authority -> ("ROLE_" + role).equals(authority.getAuthority())));
            return new AuthorizationDecision(allowed);
        };
    }

    private boolean isUuid(String value) {
        if (value == null) {
            return false;
        }
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    @Bean
    AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(),
                    ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), "Authentication is required or token is invalid"));
        };
    }

    @Bean
    AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(),
                    ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Access is denied"));
        };
    }
}
