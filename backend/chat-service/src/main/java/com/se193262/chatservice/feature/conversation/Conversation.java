package com.se193262.chatservice.feature.conversation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "cake_request_id", nullable = false)
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

    protected Conversation() {
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
}
