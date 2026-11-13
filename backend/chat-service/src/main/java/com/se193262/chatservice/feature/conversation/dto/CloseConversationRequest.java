package com.se193262.chatservice.feature.conversation.dto;

import jakarta.validation.constraints.Size;

public record CloseConversationRequest(
        @Size(max = 500) String reason
) {
}
