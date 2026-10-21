package com.se193262.chatservice.feature.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_participant_id", nullable = false)
    private UUID senderParticipantId;

    @Column(name = "client_message_id", nullable = false, unique = true)
    private UUID clientMessageId;

    @Column(name = "payload_fingerprint", nullable = false, length = 64)
    private String payloadFingerprint;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 30)
    private MessageType messageType;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ChatMessage() {
    }

    public ChatMessage(UUID conversationId, UUID senderParticipantId, UUID clientMessageId,
                       String payloadFingerprint, MessageType messageType, String content) {
        this.conversationId = conversationId;
        this.senderParticipantId = senderParticipantId;
        this.clientMessageId = clientMessageId;
        this.payloadFingerprint = payloadFingerprint;
        this.messageType = messageType;
        this.content = content;
        this.createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public void delete(Instant deletedAt) {
        this.deletedAt = deletedAt;
        this.content = null;
    }

    public UUID getId() { return id; }
    public UUID getConversationId() { return conversationId; }
    public UUID getSenderParticipantId() { return senderParticipantId; }
    public UUID getClientMessageId() { return clientMessageId; }
    public String getPayloadFingerprint() { return payloadFingerprint; }
    public MessageType getMessageType() { return messageType; }
    public String getContent() { return content; }
    public Instant getEditedAt() { return editedAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
