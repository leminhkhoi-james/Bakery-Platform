package com.se193262.bakeryservice.infrastructure.client;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.platform.client.ServiceHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class SubscriptionEntitlementClient {
    private final RestClient client;
    private final String serviceToken;
    private final ServiceHttpClient tokenClient;

    public SubscriptionEntitlementClient(
            @Value("${clients.subscription.url:http://localhost:8084}") String baseUrl,
            @Value("${clients.subscription.service-token:}") String serviceToken,
            ServiceHttpClient tokenClient) {
        this.serviceToken = serviceToken;
        this.tokenClient = tokenClient;
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(3));
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public boolean hasActiveSubscription(UUID bakeryId) {
        Entitlement response = getEntitlement(bakeryId);
        return response.active() && response.periodEnd() != null
                && response.periodEnd().isAfter(Instant.now());
    }

    public Entitlement getEntitlement(UUID bakeryId) {
        try {
            String bearer = serviceToken.isBlank()
                    ? tokenClient.serviceToken("subscription-service", "subscription:entitlement:read") : serviceToken;
            Entitlement response = client.get()
                    .uri("/internal/v1/subscriptions/bakeries/{bakeryId}/entitlement", bakeryId)
                    .headers(headers -> {
                        headers.setBearerAuth(bearer);
                        headers.set("X-Correlation-Id", UUID.randomUUID().toString());
                    })
                    .retrieve().body(Entitlement.class);
            if (response == null || !bakeryId.equals(response.bakeryId())) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Invalid subscription response");
            }
            return response;
        } catch (com.se193262.platform.exception.AppException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Subscription service credential is unavailable");
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Subscription service is unavailable");
        }
    }

    public record Entitlement(UUID bakeryId, boolean active, String planCode,
            Instant periodEnd, Map<String, String> features) { }
}
