package com.se193262.chatservice.config;

import com.se193262.chatservice.shared.dto.ApiResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private static final OAuth2Error INVALID_TOKEN_CONTRACT = new OAuth2Error(
            "invalid_token", "JWT audience or token type is invalid", null);

    @Bean
    JwtDecoder jwtDecoder(JwtProperties properties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri()).build();
        OAuth2TokenValidator<Jwt> audienceAndTypeValidator = jwt -> {
            String tokenType = jwt.getClaimAsString("token_type");
            String expectedAudience = switch (tokenType == null ? "" : tokenType) {
                case "user" -> properties.userAudience();
                case "service" -> properties.serviceAudience();
                default -> null;
            };
            return expectedAudience != null && jwt.getAudience().contains(expectedAudience)
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(INVALID_TOKEN_CONTRACT);
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtIssuerValidator(properties.issuer()),
                audienceAndTypeValidator));
        return decoder;
    }

    @Bean
    Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            Set<org.springframework.security.core.GrantedAuthority> authorities = new LinkedHashSet<>();
            List<String> roles = jwt.getClaimAsStringList("roles");
            if (roles != null) {
                roles.stream()
                        .filter(role -> role != null && !role.isBlank())
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_" + role))
                        .forEach(authorities::add);
            }
            String scopes = jwt.getClaimAsString("scope");
            if (scopes != null) {
                for (String scope : scopes.trim().split("\\s+")) {
                    if (!scope.isBlank()) {
                        authorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "SCOPE_" + scope));
                    }
                }
            }
            return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
            AuthenticationEntryPoint authenticationEntryPoint,
            AccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/v3/api-docs.yaml",
                                "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/internal/v1/**").denyAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/conversations")
                        .access(userRole("ROLE_CUSTOMER"))
                        .requestMatchers(HttpMethod.POST, "/api/v1/conversations/*/close")
                        .access(userRoleAny("ROLE_CUSTOMER", "ROLE_BAKERY_OWNER"))
                        .requestMatchers("/api/v1/**").access(userToken())
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
    AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), ApiResponse.error(
                    HttpStatus.UNAUTHORIZED.value(), "Authentication is required or token is invalid"));
        };
    }

    @Bean
    AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), ApiResponse.error(
                    HttpStatus.FORBIDDEN.value(), "Access is denied"));
        };
    }

    private AuthorizationManager<RequestAuthorizationContext> userToken() {
        return (authentication, context) -> {
            Authentication resolved = authentication.get();
            boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
                    && resolved.isAuthenticated()
                    && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"));
            return new AuthorizationDecision(allowed);
        };
    }

    private AuthorizationManager<RequestAuthorizationContext> userRole(String requiredAuthority) {
        return userRoleAny(requiredAuthority);
    }

    private AuthorizationManager<RequestAuthorizationContext> userRoleAny(String... requiredAuthorities) {
        return (authentication, context) -> {
            Authentication resolved = authentication.get();
            boolean allowed = resolved instanceof JwtAuthenticationToken jwtAuthentication
                    && resolved.isAuthenticated()
                    && "user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
                    && java.util.Arrays.stream(requiredAuthorities)
                    .anyMatch(requiredAuthority -> hasAuthority(resolved, requiredAuthority));
            return new AuthorizationDecision(allowed);
        };
    }

    private boolean hasAuthority(Authentication authentication, String requiredAuthority) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> requiredAuthority.equals(authority.getAuthority()));
    }
}
