package com.se193262.identityservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

import java.nio.file.Path;
import java.time.Duration;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        Path privateKeyPath,
        Path publicKeyPath,
        String keyId,
        String issuer,
        String userAudience,
        String serviceAudience,
        Duration accessTokenTtl,
        String privateKeyBase64,
        String publicKeyBase64
) {
    @ConstructorBinding
    public JwtProperties { }

    public JwtProperties(Path privateKeyPath, Path publicKeyPath, String keyId, String issuer,
            String userAudience, String serviceAudience, Duration accessTokenTtl) {
        this(privateKeyPath, publicKeyPath, keyId, issuer, userAudience, serviceAudience,
                accessTokenTtl, "", "");
    }
}
