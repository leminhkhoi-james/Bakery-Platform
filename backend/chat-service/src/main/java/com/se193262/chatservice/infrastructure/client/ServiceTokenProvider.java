package com.se193262.chatservice.infrastructure.client;

import com.se193262.chatservice.config.ServiceClientProperties;
import com.se193262.chatservice.exception.ChatException;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class ServiceTokenProvider {

    private static final String TOKEN_PATH = "/internal/v1/auth/service-token";
    private final ServiceClientProperties properties;
    private final RestClient identityClient;
    private final Map<TokenKey, CachedToken> tokens = new HashMap<>();

    public ServiceTokenProvider(ServiceClientProperties properties) {
        this.properties = properties;
        var requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(properties.connectTimeout()).build());
        requestFactory.setReadTimeout(properties.readTimeout());
        identityClient = RestClient.builder()
                .baseUrl(properties.identityUrl())
                .requestFactory(requestFactory)
                .build();
    }

    public synchronized String token(String audience, String scope) {
        TokenKey key = new TokenKey(audience, scope);
        CachedToken cached = tokens.get(key);
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.value();
        }
        try {
            ServiceTokenResponse response = identityClient.post()
                    .uri(TOKEN_PATH)
                    .header("X-Correlation-Id", correlationId())
                    .body(new ServiceTokenRequest(
                            properties.clientId(), properties.clientSecret(), audience, scope))
                    .retrieve()
                    .body(ServiceTokenResponse.class);
            if (response == null
                    || response.accessToken() == null
                    || response.accessToken().isBlank()
                    || response.expiresIn() <= 30) {
                throw unavailable();
            }
            Instant expiresAt = Instant.now().plusSeconds(response.expiresIn() - 30);
            tokens.put(key, new CachedToken(response.accessToken(), expiresAt));
            return response.accessToken();
        } catch (RestClientException exception) {
            throw unavailable();
        }
    }

    private String correlationId() {
        String value = MDC.get("correlationId");
        return value == null || value.isBlank() ? UUID.randomUUID().toString() : value;
    }

    private ChatException unavailable() {
        return new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                "Identity service-token issuance is unavailable");
    }

    private record TokenKey(String audience, String scope) {
    }

    private record CachedToken(String value, Instant expiresAt) {
    }

    private record ServiceTokenRequest(String clientId, String clientSecret, String audience, String scope) {
    }

    private record ServiceTokenResponse(String accessToken, long expiresIn) {
    }
}
