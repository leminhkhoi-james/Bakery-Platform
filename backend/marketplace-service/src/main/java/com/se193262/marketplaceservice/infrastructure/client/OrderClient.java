package com.se193262.marketplaceservice.infrastructure.client;

import com.se193262.platform.client.ServiceHttpClient;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OrderClient {
    public record CreateOrder(
            UUID offerId,
            UUID cakeRequestId,
            UUID customerId,
            UUID deliveryAddressId,
            String deliveryNote) {}

    public record OrderResult(UUID orderId, String orderNumber, String status) {}

    private final ServiceHttpClient http;

    public OrderClient(ServiceHttpClient http) {
        this.http = http;
    }

    public OrderResult create(CreateOrder command) {
        return http.post(
                http.properties().orderUrl(),
                "/internal/v1/orders/from-offer",
                "order-service",
                "order:create-from-offer",
                command,
                "accept-offer:" + command.offerId(),
                OrderResult.class);
    }
}
