package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.config.JwtProperties;
import com.se193262.identityservice.exception.ServiceAuthenticationFailedException;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;

@Service
@EnableConfigurationProperties(ServiceClientProperties.class)
public class ServiceTokenService {
    private final ServiceClientProperties clients;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwt;
    private final Clock clock;

    public ServiceTokenService(
            ServiceClientProperties clients,
            PasswordEncoder encoder,
            JwtEncoder jwtEncoder,
            JwtProperties jwt,
            Clock clock) {
        this.clients = clients;
        this.encoder = encoder;
        this.jwtEncoder = jwtEncoder;
        this.jwt = jwt;
        this.clock = clock;
    }

    public ServiceTokenResponse issue(ServiceTokenRequest request) {
        var configured =
                clients.clients() == null ? null : clients.clients().get(request.clientId());
        if (configured == null
                || configured.secretHash() == null
                || !encoder.matches(request.clientSecret(), configured.secretHash()))
            throw new ServiceAuthenticationFailedException();
        String granted =
                configured.grants() == null ? null : configured.grants().get(request.audience());
        Set<String> requested = new HashSet<>(Arrays.asList(request.scope().split(" +")));
        if (granted == null
                || requested.isEmpty()
                || !Set.of(granted.split(" +")).containsAll(requested))
            throw new ServiceAuthenticationFailedException();
        Instant now = clock.instant();
        var claims =
                JwtClaimsSet.builder()
                        .issuer(jwt.issuer())
                        .subject(request.clientId())
                        .audience(List.of(request.audience()))
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(300))
                        .id(UUID.randomUUID().toString())
                        .claim("token_type", "service")
                        .claim("scope", String.join(" ", new TreeSet<>(requested)))
                        .build();
        var header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(jwt.keyId()).build();
        return new ServiceTokenResponse(
                jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(), 300);
    }
}
