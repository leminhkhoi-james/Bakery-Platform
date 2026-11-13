package com.se193262.chatservice.feature.message.dto;

import com.se193262.chatservice.feature.message.MessageType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID clientMessageId,
        UUID senderId,
        MessageType messageType,
        String content,
        Instant createdAt,
        Instant editedAt,
        boolean deleted,
        List<AttachmentResponse> attachments
) {
}
