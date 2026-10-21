package com.se193262.chatservice.feature.message.dto;

import java.util.List;

public record MessagePageResponse(
        List<MessageResponse> items,
        String nextCursor,
        boolean hasMore
) {
}
