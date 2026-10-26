package com.se193262.chatservice.feature.conversation.dto;

import com.se193262.chatservice.feature.conversation.ConversationStatus;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummaryResponse(
        UUID id,
        UUID cakeRequestId,
        UUID orderId,
        UUID customerId,
        UUID bakeryId,
        ConversationStatus status,
        Instant lastMessageAt,
        long unreadCount,
        String lastMessagePreview
) {
}
