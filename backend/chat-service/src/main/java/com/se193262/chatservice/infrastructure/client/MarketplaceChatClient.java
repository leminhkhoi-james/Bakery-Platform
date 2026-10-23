package com.se193262.chatservice.infrastructure.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.UUID;

@HttpExchange("/internal/v1")
public interface MarketplaceChatClient {

    @GetExchange("/cake-requests/{cakeRequestId}/chat-authorization")
    ChatAuthorizationResponse authorizeChat(
            @PathVariable UUID cakeRequestId,
            @RequestParam UUID customerId,
            @RequestParam UUID bakeryId);

    record ChatAuthorizationResponse(
            UUID cakeRequestId,
            UUID customerId,
            UUID bakeryId,
            String requestStatus,
            boolean authorized
    ) {
    }
}
