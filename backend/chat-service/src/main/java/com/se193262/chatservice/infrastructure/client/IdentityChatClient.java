package com.se193262.chatservice.infrastructure.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.UUID;

@HttpExchange("/internal/v1/users")
public interface IdentityChatClient {
    @GetExchange("/{id}")
    UserProfile profile(@PathVariable UUID id);

    record UserProfile(UUID id, String displayName) { }
}
