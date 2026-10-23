package com.se193262.chatservice.feature.conversation.dto;

import com.se193262.chatservice.feature.conversation.ParticipantType;

import java.time.Instant;
import java.util.UUID;

public record ParticipantResponse(
        UUID userId,
        ParticipantType participantType,
        Instant joinedAt,
        Instant lastReadAt
) {
}
