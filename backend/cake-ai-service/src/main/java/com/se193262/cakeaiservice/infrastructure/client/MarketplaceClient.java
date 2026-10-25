package com.se193262.cakeaiservice.infrastructure.client;

import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.exception.BusinessException;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class MarketplaceClient {
    public record RequestContext(UUID id, UUID customerId, String status, boolean aiEligible) {}
    private final ServiceHttpClient http;

    public MarketplaceClient(ServiceHttpClient http) { this.http = http; }

    public void validate(UUID requestId, UUID customerId) {
        RequestContext context = http.get(http.properties().marketplaceUrl(),
                "/internal/v1/cake-requests/" + requestId + "/context", "marketplace-service",
                "marketplace:request:read", RequestContext.class);
        if (!requestId.equals(context.id()) || !customerId.equals(context.customerId()))
            throw BusinessException.forbidden();
        if (!context.aiEligible()) throw BusinessException.invalid("Request is not eligible for AI generation");
    }
}
