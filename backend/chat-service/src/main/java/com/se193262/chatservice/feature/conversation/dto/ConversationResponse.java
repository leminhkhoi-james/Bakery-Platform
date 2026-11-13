package com.se193262.chatservice.feature.conversation.dto;

import com.se193262.chatservice.feature.conversation.ConversationStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID cakeRequestId,
        UUID orderId,
        UUID customerId,
        UUID bakeryId,
        ConversationStatus status,
        String closeReason,
        Instant lastMessageAt,
        Instant createdAt,
        Instant currentUserLastReadAt,
        List<ParticipantResponse> participants
) {
}
