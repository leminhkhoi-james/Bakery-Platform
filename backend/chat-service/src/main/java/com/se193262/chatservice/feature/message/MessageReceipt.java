package com.se193262.chatservice.feature.message;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "message_receipts")
public class MessageReceipt {

    @EmbeddedId
    private MessageReceiptId id;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "read_at")
    private Instant readAt;

    protected MessageReceipt() {
    }

    public MessageReceipt(MessageReceiptId id, Instant deliveredAt) {
        this.id = id;
        this.deliveredAt = deliveredAt;
    }

    public void markRead(Instant time) {
        if (deliveredAt == null) {
            deliveredAt = time;
        }
        if (readAt == null || time.isAfter(readAt)) {
            readAt = time;
        }
    }
}
