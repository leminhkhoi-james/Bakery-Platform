package com.se193262.chatservice.feature.conversation.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateConversationRequest(
        @NotNull UUID cakeRequestId,
        @NotNull UUID bakeryId
) {
}
