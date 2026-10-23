package com.se193262.identityservice.feature.authentication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.se193262.identityservice.config.JwtProperties;
import com.se193262.identityservice.exception.ServiceAuthenticationFailedException;

import org.junit.jupiter.api.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.*;

import java.time.*;
import java.util.*;

class ServiceTokenServiceTest {
    final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(4);
    final JwtEncoder encoder = mock(JwtEncoder.class);

    ServiceTokenService service() {
        var client =
                new ServiceClientProperties.Client(
                        passwords.encode("test-secret"),
                        Map.of("order-service", "order:create-from-offer"));
        return new ServiceTokenService(
                new ServiceClientProperties(Map.of("marketplace-service", client)),
                passwords,
                encoder,
                new JwtProperties(
                        null,
                        null,
                        "test-key",
                        "issuer",
                        "api",
                        "identity-service",
                        Duration.ofMinutes(15)),
                Clock.systemUTC());
    }

    @Test
    @DisplayName("Client credentials issue a five-minute target-scoped service token")
    void issue_validGrant_containsServiceClaims() {
        when(encoder.encode(any()))
                .thenAnswer(
                        a -> {
                            JwtEncoderParameters parameters = a.getArgument(0);
                            assertEquals("service", parameters.getClaims().getClaim("token_type"));
                            assertEquals(
                                    List.of("order-service"), parameters.getClaims().getAudience());
                            assertEquals(
                                    "order:create-from-offer",
                                    parameters.getClaims().getClaim("scope"));
                            return Jwt.withTokenValue("signed")
                                    .header("alg", "RS256")
                                    .claims(c -> c.putAll(parameters.getClaims().getClaims()))
                                    .build();
                        });
        var result =
                service()
                        .issue(
                                new ServiceTokenRequest(
                                        "marketplace-service",
                                        "test-secret",
                                        "order-service",
                                        "order:create-from-offer"));
        assertEquals(300, result.expiresIn());
        assertEquals("signed", result.accessToken());
    }

    @Test
    @DisplayName("Unknown clients and wrong secrets cannot obtain service tokens")
    void issue_wrongCredentials_denied() {
        var service = service();
        assertThrows(
                ServiceAuthenticationFailedException.class,
                () ->
                        service.issue(
                                new ServiceTokenRequest(
                                        "unknown",
                                        "test-secret",
                                        "order-service",
                                        "order:create-from-offer")));
        assertThrows(
                ServiceAuthenticationFailedException.class,
                () ->
                        service.issue(
                                new ServiceTokenRequest(
                                        "marketplace-service",
                                        "wrong",
                                        "order-service",
                                        "order:create-from-offer")));
        verifyNoInteractions(encoder);
    }

    @Test
    @DisplayName("Clients cannot escalate target audience or scopes")
    void issue_ungrantedAudienceOrScope_denied() {
        var service = service();
        assertThrows(
                ServiceAuthenticationFailedException.class,
                () ->
                        service.issue(
                                new ServiceTokenRequest(
                                        "marketplace-service",
                                        "test-secret",
                                        "identity-service",
                                        "order:create-from-offer")));
        assertThrows(
                ServiceAuthenticationFailedException.class,
                () ->
                        service.issue(
                                new ServiceTokenRequest(
                                        "marketplace-service",
                                        "test-secret",
                                        "order-service",
                                        "order:create-from-offer admin:all")));
        verifyNoInteractions(encoder);
    }
}
