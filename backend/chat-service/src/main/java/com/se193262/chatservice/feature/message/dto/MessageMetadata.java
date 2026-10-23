package com.se193262.chatservice.feature.message.dto;

import com.se193262.chatservice.feature.message.MessageType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record MessageMetadata(
        @NotNull UUID clientMessageId,
        @NotNull MessageType messageType,
        @Size(max = 10_000) String content
) {
}
