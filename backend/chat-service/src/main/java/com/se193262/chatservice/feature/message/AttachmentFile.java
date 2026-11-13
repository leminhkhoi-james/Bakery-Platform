package com.se193262.chatservice.feature.message;

public record AttachmentFile(
        String originalFileName,
        String mediaType,
        byte[] content
) {

    public long size() {
        return content.length;
    }
}
