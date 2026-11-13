package com.se193262.chatservice.feature.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "message_attachments")
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "original_file_name", nullable = false)
    private String originalFileName;

    @Column(name = "media_type", nullable = false, length = 100)
    private String mediaType;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected MessageAttachment() {
    }

    public MessageAttachment(UUID messageId, String objectKey, String originalFileName,
                            String mediaType, long fileSize, int displayOrder) {
        this.messageId = messageId;
        this.objectKey = objectKey;
        this.originalFileName = originalFileName;
        this.mediaType = mediaType;
        this.fileSize = fileSize;
        this.displayOrder = displayOrder;
    }

    public UUID getId() { return id; }
    public UUID getMessageId() { return messageId; }
    public String getObjectKey() { return objectKey; }
    public String getOriginalFileName() { return originalFileName; }
    public String getMediaType() { return mediaType; }
    public long getFileSize() { return fileSize; }
    public int getDisplayOrder() { return displayOrder; }
}
