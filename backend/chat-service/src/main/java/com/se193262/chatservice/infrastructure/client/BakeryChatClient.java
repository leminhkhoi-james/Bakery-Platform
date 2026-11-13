package com.se193262.chatservice.infrastructure.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.UUID;

@HttpExchange("/internal/v1")
public interface BakeryChatClient {

    @GetExchange("/bakeries/{bakeryId}/members/{userId}/authorization")
    MembershipAuthorizationResponse authorizeMember(
            @PathVariable UUID bakeryId,
            @PathVariable UUID userId,
            @RequestParam(required = false) String requiredRole);

    record MembershipAuthorizationResponse(
            UUID bakeryId,
            UUID userId,
            boolean active,
            String memberRole,
            boolean authorized
    ) {
    }
}
