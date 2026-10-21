package com.se193262.bakeryservice.security;

import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
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

    private final BakeryMemberRepository memberRepository;

    public SecurityConfig(BakeryMemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

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
                        .requestMatchers("/api/v1/admin/**").access(userRole("ADMIN"))
                        .requestMatchers(HttpMethod.POST, "/api/v1/bakeries").access(userRole("BAKERY_OWNER"))
                        .requestMatchers(HttpMethod.GET, "/api/v1/bakeries/{bakeryId}/members")
                        .access(memberRole(BakeryMemberRole.OWNER, BakeryMemberRole.MANAGER))
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/bakeries/{bakeryId}",
                                "/api/v1/bakeries/{bakeryId}/categories",
                                "/api/v1/bakeries/{bakeryId}/add-ons",
                                "/api/v1/bakeries/{bakeryId}/products")
                        .access(memberRole(BakeryMemberRole.OWNER, BakeryMemberRole.MANAGER,
                                BakeryMemberRole.STAFF))
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/v1/bakeries/{bakeryId}",
                                "/api/v1/bakeries/{bakeryId}/members/{memberId}",
                                "/api/v1/bakeries/{bakeryId}/categories/{categoryId}",
                                "/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}",
                                "/api/v1/bakeries/{bakeryId}/products/{productId}")
                        .access(memberRole(BakeryMemberRole.OWNER, BakeryMemberRole.MANAGER))
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/bakeries/{bakeryId}/members",
                                "/api/v1/bakeries/{bakeryId}/categories",
                                "/api/v1/bakeries/{bakeryId}/add-ons",
                                "/api/v1/bakeries/{bakeryId}/products")
                        .access(memberRole(BakeryMemberRole.OWNER, BakeryMemberRole.MANAGER))
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/bakeries/{bakeryId}/operations",
                                "/api/v1/bakeries/{bakeryId}/products/{productId}/options")
                        .access(memberRole(BakeryMemberRole.OWNER, BakeryMemberRole.MANAGER))
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/bakeries/{bakeryId}/members/{memberId}",
                                "/api/v1/bakeries/{bakeryId}/categories/{categoryId}",
                                "/api/v1/bakeries/{bakeryId}/add-ons/{addOnId}")
                        .access(memberRole(BakeryMemberRole.OWNER, BakeryMemberRole.MANAGER))
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

    private AuthorizationManager<RequestAuthorizationContext> userRole(String role) {
        return (authentication, context) -> {
            Authentication resolved = authentication.get();
            return new AuthorizationDecision(isUser(resolved) && hasRole(resolved, role));
        };
    }

    private AuthorizationManager<RequestAuthorizationContext> memberRole(BakeryMemberRole... allowedRoles) {
        return (authentication, context) -> {
            Authentication resolved = authentication.get();
            if (!isUser(resolved)
                    || !(hasRole(resolved, "BAKERY_OWNER") || hasRole(resolved, "BAKERY_STAFF"))) {
                return new AuthorizationDecision(false);
            }
            try {
                String bakeryIdValue = context.getVariables().get("bakeryId");
                if (bakeryIdValue == null) {
                    return new AuthorizationDecision(false);
                }
                UUID bakeryId = UUID.fromString(bakeryIdValue);
                UUID userId = UUID.fromString(((JwtAuthenticationToken) resolved).getToken().getSubject());
                boolean allowed = memberRepository.findByBakery_IdAndUserId(bakeryId, userId)
                        .filter(member -> member.getStatus() == BakeryMemberStatus.ACTIVE)
                        .map(member -> Arrays.asList(allowedRoles).contains(member.getMemberRole()))
                        .orElse(false);
                return new AuthorizationDecision(allowed);
            } catch (IllegalArgumentException exception) {
                return new AuthorizationDecision(false);
            }
        };
    }

    private boolean isUser(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()
                || !"user".equals(jwtAuthentication.getToken().getClaimAsString("token_type"))
                || jwtAuthentication.getToken().getSubject() == null) {
            return false;
        }
        try {
            UUID.fromString(jwtAuthentication.getToken().getSubject());
            return true;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> ("ROLE_" + role).equals(authority.getAuthority()));
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
