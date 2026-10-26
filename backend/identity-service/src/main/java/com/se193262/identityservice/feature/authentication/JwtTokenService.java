package com.se193262.identityservice.feature.authentication;

import com.nimbusds.jose.jwk.RSAKey;
import com.se193262.identityservice.config.JwtProperties;
import com.se193262.identityservice.feature.user.User;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties properties;
    private final RSAKey rsaKey;
    private final Clock clock;

    public JwtTokenService(JwtEncoder jwtEncoder, JwtProperties properties, RSAKey rsaKey, Clock clock) {
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
        this.rsaKey = rsaKey;
        this.clock = clock;
    }

    public AccessToken issueUserToken(User user) {
        Instant issuedAt = clock.instant();
        Duration timeToLive = properties.accessTokenTtl();
        Instant expiresAt = issuedAt.plus(timeToLive);
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getCode())
                .sorted()
                .toList();

        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(rsaKey.getKeyID())
                .build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .subject(user.getId().toString())
                .audience(List.of(properties.userAudience()))
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .id(UUID.randomUUID().toString())
                .claim("token_type", "user")
                .claim("email", user.getEmail())
                .claim("roles", roles)
                .build();

        String value = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AccessToken(value, timeToLive.toSeconds());
    }
}
