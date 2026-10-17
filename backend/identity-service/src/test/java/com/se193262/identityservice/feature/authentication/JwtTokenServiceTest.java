package com.se193262.identityservice.feature.authentication;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.se193262.identityservice.config.JwtProperties;
import com.se193262.identityservice.feature.user.Role;
import com.se193262.identityservice.feature.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtTokenServiceTest {

    @Test
    @DisplayName("Access token chứa đầy đủ subject, role, type, audience và kid")
    void issueUserToken_activeUser_containsRequiredClaims() throws Exception {
        RSAKey rsaKey = generateRsaKey();
        NimbusJwtEncoder encoder = new NimbusJwtEncoder(
                new ImmutableJWKSet<SecurityContext>(new JWKSet(rsaKey)));
        JwtProperties properties = new JwtProperties(
                null, null, "test-key", "bakery-platform-identity",
                "bakery-platform-api", "identity-service", Duration.ofMinutes(15));
        Instant now = Instant.now();
        JwtTokenService service = new JwtTokenService(
                encoder, properties, rsaKey, Clock.fixed(now, ZoneOffset.UTC));
        UUID userId = UUID.randomUUID();
        Role role = mock(Role.class);
        User user = mock(User.class);
        when(role.getCode()).thenReturn("CUSTOMER");
        when(user.getId()).thenReturn(userId);
        when(user.getEmail()).thenReturn("customer@example.com");
        when(user.getRoles()).thenReturn(Set.of(role));

        AccessToken result = service.issueUserToken(user);
        Jwt jwt = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build().decode(result.value());

        assertEquals(userId.toString(), jwt.getSubject());
        assertEquals("user", jwt.getClaimAsString("token_type"));
        assertEquals(java.util.List.of("CUSTOMER"), jwt.getClaimAsStringList("roles"));
        assertEquals(java.util.List.of("bakery-platform-api"), jwt.getAudience());
        assertEquals("test-key", jwt.getHeaders().get("kid"));
        assertEquals(900, result.expiresInSeconds());
    }

    private RSAKey generateRsaKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair pair = generator.generateKeyPair();
        return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                .privateKey((RSAPrivateKey) pair.getPrivate())
                .keyID("test-key")
                .algorithm(JWSAlgorithm.RS256)
                .keyUse(KeyUse.SIGNATURE)
                .build();
    }
}
