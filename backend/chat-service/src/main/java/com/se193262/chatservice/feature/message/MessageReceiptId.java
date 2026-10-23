package com.se193262.chatservice.feature.message;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
public class MessageReceiptId implements Serializable {

    @Column(name = "message_id")
    private UUID messageId;

    @Column(name = "participant_id")
    private UUID participantId;

    protected MessageReceiptId() {
    }

    public MessageReceiptId(UUID messageId, UUID participantId) {
        this.messageId = messageId;
        this.participantId = participantId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof MessageReceiptId that)) return false;
        return java.util.Objects.equals(messageId, that.messageId)
                && java.util.Objects.equals(participantId, that.participantId);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(messageId, participantId);
    }
}
