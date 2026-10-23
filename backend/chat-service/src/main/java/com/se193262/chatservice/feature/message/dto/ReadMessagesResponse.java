package com.se193262.chatservice.feature.message.dto;

import java.time.Instant;
import java.util.UUID;

public record ReadMessagesResponse(UUID conversationId, Instant lastReadAt) {
}
