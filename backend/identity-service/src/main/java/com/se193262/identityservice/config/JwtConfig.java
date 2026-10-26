package com.se193262.identityservice.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Clock;
import java.util.Base64;

@Configuration
@EnableConfigurationProperties({JwtProperties.class, AuthProperties.class, CorsProperties.class})
public class JwtConfig {

    private static final OAuth2Error INVALID_AUDIENCE = new OAuth2Error(
            "invalid_token", "JWT audience or token type is invalid", null);

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    @ConditionalOnMissingBean(RSAKey.class)
    RSAKey rsaKey(JwtProperties properties) {
        RSAPrivateKey privateKey = readPrivateKey(properties);
        RSAPublicKey publicKey = readPublicKey(properties);
        if (!privateKey.getModulus().equals(publicKey.getModulus())) {
            throw new IllegalStateException("Configured JWT private and public keys do not match");
        }
        return new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(requireText(properties.keyId(), "security.jwt.key-id"))
                .algorithm(JWSAlgorithm.RS256)
                .keyUse(KeyUse.SIGNATURE)
                .build();
    }

    @Bean
    JwtEncoder jwtEncoder(RSAKey rsaKey) {
        ImmutableJWKSet<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    JwtDecoder jwtDecoder(RSAKey rsaKey, JwtProperties properties) throws Exception {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey())
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();

        OAuth2TokenValidator<Jwt> audienceValidator = token -> {
            String tokenType = token.getClaimAsString("token_type");
            String requiredAudience = "service".equals(tokenType)
                    ? properties.serviceAudience()
                    : "user".equals(tokenType) ? properties.userAudience() : null;
            if (requiredAudience != null && token.getAudience().contains(requiredAudience)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(INVALID_AUDIENCE);
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtIssuerValidator(requireText(properties.issuer(), "security.jwt.issuer")),
                audienceValidator,
                new JwtClaimValidator<String>("sub", subject -> subject != null && !subject.isBlank())
        ));
        return decoder;
    }

    @Bean
    Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return new BakeryJwtAuthenticationConverter();
    }

    private RSAPrivateKey readPrivateKey(JwtProperties properties) {
        String pem = readPem(properties.privateKeyPath(), "security.jwt.private-key-path");
        byte[] encoded = decodePem(pem, "PRIVATE KEY");
        try {
            return (RSAPrivateKey) KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(encoded));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot parse JWT PKCS#8 private key", exception);
        }
    }

    private RSAPublicKey readPublicKey(JwtProperties properties) {
        String pem = readPem(properties.publicKeyPath(), "security.jwt.public-key-path");
        byte[] encoded = decodePem(pem, "PUBLIC KEY");
        try {
            return (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(encoded));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot parse JWT X.509 public key", exception);
        }
    }

    private String readPem(java.nio.file.Path path, String propertyName) {
        if (path == null) {
            throw new IllegalStateException(propertyName + " must be configured");
        }
        try {
            return Files.readString(path, StandardCharsets.US_ASCII);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot read " + propertyName + " from " + path, exception);
        }
    }

    private byte[] decodePem(String pem, String type) {
        String normalized = pem
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s", "");
        try {
            return Base64.getDecoder().decode(normalized);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid PEM content for " + type, exception);
        }
    }

    private String requireText(String value, String propertyName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(propertyName + " must be configured");
        }
        return value;
    }
}
