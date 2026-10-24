package com.se193262.subscriptionservice.infrastructure.client;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.platform.client.ServiceHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.UUID;

@Component
public class BakeryAccessClient {
    private final RestClient client;
    private final String serviceToken;
    private final ServiceHttpClient tokenClient;

    public BakeryAccessClient(@Value("${clients.bakery.url:http://localhost:8082}") String baseUrl,
            @Value("${clients.bakery.service-token:}") String serviceToken,
            ServiceHttpClient tokenClient) {
        this.serviceToken = serviceToken;
        this.tokenClient = tokenClient;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public void requireBakery(UUID bakeryId) {
        Profile profile = call("/internal/v1/bakeries/{bakeryId}", Profile.class, bakeryId);
        if (!bakeryId.equals(profile.id())) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Invalid Bakery profile response");
        }
    }

    public void requireMember(UUID bakeryId, UUID userId, boolean ownerRequired) {
        Authorization response = call(ownerRequired
                        ? "/internal/v1/bakeries/{bakeryId}/members/{userId}/authorization?requiredRole=OWNER"
                        : "/internal/v1/bakeries/{bakeryId}/members/{userId}/authorization",
                Authorization.class, bakeryId, userId);
        if (response == null || !bakeryId.equals(response.bakeryId())
                || !userId.equals(response.userId())) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Invalid Bakery authorization response");
        }
        if (!response.active() || !response.authorized()
                || (ownerRequired && !"OWNER".equals(response.memberRole()))) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bakery membership is required");
        }
    }

    private <T> T call(String path, Class<T> type, Object... variables) {
        try {
            String bearer = serviceToken.isBlank() ? tokenClient.serviceToken("bakery-service",
                    "bakery:profile:read bakery:membership:read") : serviceToken;
            T response = client.get().uri(path, variables).headers(headers -> {
                headers.setBearerAuth(bearer);
                headers.set("X-Correlation-Id", UUID.randomUUID().toString());
            }).retrieve().body(type);
            if (response == null) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Empty Bakery service response");
            }
            return response;
        } catch (com.se193262.platform.exception.AppException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Bakery service credential is unavailable");
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 404) {
                throw new AppException(HttpStatus.NOT_FOUND, "Bakery not found");
            }
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Bakery validation is unavailable");
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Bakery validation is unavailable");
        }
    }

    public record Profile(UUID id, String name, String status) { }
    public record Authorization(UUID bakeryId, UUID userId, boolean active,
                                String memberRole, boolean authorized) { }
}
