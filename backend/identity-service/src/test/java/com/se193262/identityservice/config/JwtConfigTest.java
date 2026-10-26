package com.se193262.identityservice.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtConfigTest {

    private JwtConfig jwtConfig;
    private JwtProperties properties;
    private RSAKey rsaKey;

    @BeforeEach
    void setUp() throws Exception {
        jwtConfig = new JwtConfig();
        properties = new JwtProperties(
                null,
                null,
                "test-key",
                "bakery-platform-identity",
                "bakery-platform-api",
                "identity-service",
                Duration.ofMinutes(15)
        );
        rsaKey = generateRsaKey("test-key");
    }

    @Test
    @DisplayName("Decoder chấp nhận user JWT RS256 đúng issuer và audience")
    void decode_validUserToken_succeeds() throws Exception {
        JwtDecoder decoder = jwtConfig.jwtDecoder(rsaKey, properties);
        String token = encode(jwtConfig.jwtEncoder(rsaKey), rsaKey, "user",
                properties.issuer(), properties.userAudience(), Instant.now().plusSeconds(60));

        assertDoesNotThrow(() -> decoder.decode(token));
    }

    @Test
    @DisplayName("Decoder từ chối JWT sai audience")
    void decode_wrongAudience_throwsJwtException() throws Exception {
        JwtDecoder decoder = jwtConfig.jwtDecoder(rsaKey, properties);
        String token = encode(jwtConfig.jwtEncoder(rsaKey), rsaKey, "user",
                properties.issuer(), "wrong-audience", Instant.now().plusSeconds(60));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    @DisplayName("Decoder từ chối JWT hết hạn")
    void decode_expiredToken_throwsJwtException() throws Exception {
        JwtDecoder decoder = jwtConfig.jwtDecoder(rsaKey, properties);
        String token = encode(jwtConfig.jwtEncoder(rsaKey), rsaKey, "user",
                properties.issuer(), properties.userAudience(), Instant.now().minusSeconds(60));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    @DisplayName("Decoder từ chối JWT ký bằng private key khác")
    void decode_wrongSignature_throwsJwtException() throws Exception {
        RSAKey otherKey = generateRsaKey("other-key");
        JwtDecoder decoder = jwtConfig.jwtDecoder(rsaKey, properties);
        String token = encode(jwtConfig.jwtEncoder(otherKey), otherKey, "user",
                properties.issuer(), properties.userAudience(), Instant.now().plusSeconds(60));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    @DisplayName("Decoder từ chối token type không được hỗ trợ")
    void decode_unknownTokenType_throwsJwtException() throws Exception {
        JwtDecoder decoder = jwtConfig.jwtDecoder(rsaKey, properties);
        String token = encode(jwtConfig.jwtEncoder(rsaKey), rsaKey, "unknown",
                properties.issuer(), properties.userAudience(), Instant.now().plusSeconds(60));

        assertThrows(JwtException.class, () -> decoder.decode(token));
    }

    @Test
    @DisplayName("Public JWK không chứa private RSA parameter")
    void publicJwk_neverContainsPrivateExponent() {
        assertFalse(rsaKey.toPublicJWK().toJSONObject().containsKey("d"));
    }

    private String encode(
            JwtEncoder encoder,
            RSAKey signingKey,
            String tokenType,
            String issuer,
            String audience,
            Instant expiresAt
    ) {
        Instant issuedAt = expiresAt.minusSeconds(30);
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(signingKey.getKeyID())
                .build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(UUID.randomUUID().toString())
                .audience(List.of(audience))
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("token_type", tokenType)
                .build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private RSAKey generateRsaKey(String keyId) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair pair = generator.generateKeyPair();
        return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                .privateKey((RSAPrivateKey) pair.getPrivate())
                .keyID(keyId)
                .algorithm(JWSAlgorithm.RS256)
                .keyUse(KeyUse.SIGNATURE)
                .build();
    }
}
