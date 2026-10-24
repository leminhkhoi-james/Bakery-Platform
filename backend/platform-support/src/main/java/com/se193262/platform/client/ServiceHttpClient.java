package com.se193262.platform.client;

import com.se193262.platform.config.RemoteProperties;
import com.se193262.platform.exception.BusinessException;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.*;

import java.net.http.HttpClient;
import java.time.*;
import java.util.*;

public class ServiceHttpClient {
    private final RemoteProperties properties;
    private final RestClient client;
    private final Map<String, Token> tokens = new HashMap<>();

    private record Token(String value, Instant expiry) {}

    public record TokenResponse(String accessToken, long expiresIn) {}

    public ServiceHttpClient(RemoteProperties properties) {
        this.properties = properties;
        var factory =
                new JdkClientHttpRequestFactory(
                        HttpClient.newBuilder()
                                .connectTimeout(properties.connectTimeout())
                                .build());
        factory.setReadTimeout(properties.readTimeout());
        client = RestClient.builder().requestFactory(factory).build();
    }

    public RemoteProperties properties() {
        return properties;
    }

    public String serviceToken(String audience, String scope) {
        return token(audience, scope);
    }

    public <T> T get(String base, String path, String audience, String scope, Class<T> type) {
        return exchange(base, path, audience, scope, null, null, type);
    }

    public <T> T post(
            String base,
            String path,
            String audience,
            String scope,
            Object body,
            String key,
            Class<T> type) {
        return exchange(base, path, audience, scope, body, key, type);
    }

    private <T> T exchange(
            String base,
            String path,
            String audience,
            String scope,
            Object body,
            String key,
            Class<T> type) {
        try {
            var request =
                    body == null ? client.get().uri(base + path) : client.post().uri(base + path);
            request.header("Authorization", "Bearer " + token(audience, scope));
            String correlation = org.slf4j.MDC.get("correlationId");
            request.header(
                    "X-Correlation-Id",
                    correlation == null ? UUID.randomUUID().toString() : correlation);
            if (key != null) request.header("Idempotency-Key", key);
            if (body != null) ((RestClient.RequestBodySpec) request).body(body);
            T result = request.retrieve().body(type);
            if (result == null) throw BusinessException.unavailable();
            return result;
        } catch (RestClientResponseException error) {
            int status = error.getStatusCode().value();
            if (status == 404) throw BusinessException.missing();
            if (status == 409) throw BusinessException.conflict();
            if (status == 422 || status == 400)
                throw BusinessException.invalid("Remote validation failed");
            throw BusinessException.unavailable();
        } catch (RestClientException error) {
            throw BusinessException.unavailable();
        }
    }

    private synchronized String token(String audience, String scope) {
        String cacheKey = audience + ":" + scope;
        Token cached = tokens.get(cacheKey);
        if (cached != null && cached.expiry().isAfter(Instant.now().plusSeconds(30)))
            return cached.value();
        try {
            TokenResponse response =
                    client.post()
                            .uri(properties.identityUrl() + "/internal/v1/auth/service-token")
                            .body(
                                    Map.of(
                                            "clientId",
                                            properties.clientId(),
                                            "clientSecret",
                                            properties.clientSecret(),
                                            "audience",
                                            audience,
                                            "scope",
                                            scope))
                            .retrieve()
                            .body(TokenResponse.class);
            if (response == null
                    || response.accessToken() == null
                    || response.accessToken().isBlank()
                    || response.expiresIn() <= 30) throw BusinessException.unavailable();
            tokens.put(
                    cacheKey,
                    new Token(
                            response.accessToken(),
                            Instant.now().plusSeconds(response.expiresIn())));
            return response.accessToken();
        } catch (RestClientException error) {
            throw BusinessException.unavailable();
        }
    }
}
