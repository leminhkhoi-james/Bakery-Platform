package com.se193262.bakeryservice.infrastructure.client;

import com.se193262.bakeryservice.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Component
public class IdentityUserClient {
    private final RestClient client;
    private final String serviceToken;

    public IdentityUserClient(@Value("${clients.identity.url:http://localhost:8080}") String baseUrl,
            @Value("${clients.identity.service-token:}") String serviceToken) {
        this.serviceToken = serviceToken;
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(3));
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public void requireEligibleMember(UUID userId) {
        if (serviceToken.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Identity service credential is not configured");
        }
        try {
            UserResponse user = client.get().uri("/internal/v1/users/{userId}", userId)
                    .headers(headers -> {
                        headers.setBearerAuth(serviceToken);
                        headers.set("X-Correlation-Id", UUID.randomUUID().toString());
                    })
                    .retrieve().body(UserResponse.class);
            if (user == null || !userId.equals(user.id())) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Invalid Identity response");
            }
            if (!"ACTIVE".equals(user.status()) || user.roles() == null
                    || user.roles().stream().noneMatch(platformRole ->
                    platformRole.equals("BAKERY_STAFF") || platformRole.equals("BAKERY_OWNER"))) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "User does not have an eligible bakery platform role");
            }
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 404) {
                throw new AppException(HttpStatus.NOT_FOUND, "User not found");
            }
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service is unavailable");
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service is unavailable");
        }
    }

    private record UserResponse(UUID id, String status, List<String> roles) { }
}
