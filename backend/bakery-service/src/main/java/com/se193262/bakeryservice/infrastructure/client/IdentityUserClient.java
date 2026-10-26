package com.se193262.bakeryservice.infrastructure.client;

import com.se193262.bakeryservice.exception.AppException;
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
import java.util.List;
import java.util.UUID;

@Component
public class IdentityUserClient {
    private final RestClient client;
    private final String serviceToken;
    private final ServiceHttpClient tokenClient;

    public IdentityUserClient(@Value("${clients.identity.url:http://localhost:8080}") String baseUrl,
            @Value("${clients.identity.service-token:}") String serviceToken,
            ServiceHttpClient tokenClient) {
        this.serviceToken = serviceToken;
        this.tokenClient = tokenClient;
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(3));
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }

    public UserProfile requireEligibleMember(UUID userId) {
        UserProfile user = getUser(userId);
        if (user.roles() == null || user.roles().stream().noneMatch(role ->
                role.equals("BAKERY_STAFF") || role.equals("BAKERY_OWNER"))) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "User does not have an eligible bakery platform role");
        }
        return user;
    }

    public UserProfile requireOwner(UUID userId) {
        UserProfile user = getUser(userId);
        if (user.roles() == null || !user.roles().contains("BAKERY_OWNER")) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "User is not a bakery owner");
        }
        return user;
    }

    public UserProfile getUser(UUID userId) {
        try {
            String bearer = serviceToken.isBlank()
                    ? tokenClient.serviceToken("identity-service", "identity:user:read") : serviceToken;
            UserProfile user = client.get().uri("/internal/v1/users/{userId}", userId)
                    .headers(headers -> {
                        headers.setBearerAuth(bearer);
                        headers.set("X-Correlation-Id", UUID.randomUUID().toString());
                    })
                    .retrieve().body(UserProfile.class);
            if (user == null || !userId.equals(user.id())
                    || user.displayName() == null || user.displayName().isBlank()
                    || user.displayName().length() > 120) {
                throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Invalid Identity response");
            }
            if (!"ACTIVE".equals(user.status())) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "User is not active");
            }
            return user;
        } catch (com.se193262.platform.exception.AppException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service credential is unavailable");
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 404) {
                throw new AppException(HttpStatus.NOT_FOUND, "User not found");
            }
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service is unavailable");
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service is unavailable");
        }
    }

    public record UserProfile(UUID id, String displayName, String status, List<String> roles) { }
}
