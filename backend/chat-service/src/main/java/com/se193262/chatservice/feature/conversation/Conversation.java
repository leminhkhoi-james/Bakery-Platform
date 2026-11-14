package com.se193262.chatservice.feature.conversation;

import com.se193262.platform.persistence.UuidEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "conversations")
public class Conversation extends UuidEntity {


    @Column(name = "cake_request_id")
    private UUID cakeRequestId;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "bakery_id", nullable = false)
    private UUID bakeryId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConversationStatus status = ConversationStatus.OPEN;

    @Column(name = "close_reason", length = 500)
    private String closeReason;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public Conversation() {
    }

    public Conversation(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        this.cakeRequestId = cakeRequestId;
        this.customerId = customerId;
        this.bakeryId = bakeryId;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public void close(String reason) {
        status = ConversationStatus.CLOSED;
        closeReason = reason;
    }

    public void recordMessage(Instant sentAt) {
        lastMessageAt = sentAt;
    }

    public UUID getId() { return id; }
    public UUID getCakeRequestId() { return cakeRequestId; }
    public UUID getOrderId() { return orderId; }
    public UUID getCustomerId() { return customerId; }
    public UUID getBakeryId() { return bakeryId; }
    public ConversationStatus getStatus() { return status; }
    public String getCloseReason() { return closeReason; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void setCakeRequestId(UUID value) { this.cakeRequestId = value; }
    public void setOrderId(UUID value) { this.orderId = value; }
    public void setCustomerId(UUID value) { this.customerId = value; }
    public void setBakeryId(UUID value) { this.bakeryId = value; }
    public void setStatus(ConversationStatus value) { this.status = value; }
    public void setLastMessageAt(Instant value) { this.lastMessageAt = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
}
