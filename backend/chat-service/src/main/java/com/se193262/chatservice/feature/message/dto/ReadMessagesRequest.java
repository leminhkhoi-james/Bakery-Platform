package com.se193262.chatservice.feature.message.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReadMessagesRequest(@NotNull UUID throughMessageId) {
}
