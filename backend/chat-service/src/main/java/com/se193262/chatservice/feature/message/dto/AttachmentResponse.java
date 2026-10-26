package com.se193262.chatservice.feature.message.dto;

import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String originalFileName,
        String mediaType,
        long fileSize,
        String url
) {
}
