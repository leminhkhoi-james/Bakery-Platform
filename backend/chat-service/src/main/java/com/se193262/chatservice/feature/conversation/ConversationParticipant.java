package com.se193262.chatservice.feature.conversation;

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
@Table(name = "conversation_participants")
public class ConversationParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_type", nullable = false, length = 30)
    private ParticipantType participantType;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    protected ConversationParticipant() {
    }

    public ConversationParticipant(UUID conversationId, UUID userId, ParticipantType participantType) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.participantType = participantType;
        this.joinedAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    public void markRead(Instant readAt) {
        if (lastReadAt == null || readAt.isAfter(lastReadAt)) {
            lastReadAt = readAt;
        }
    }

    public void reactivate(ParticipantType type) {
        this.participantType = type;
        this.joinedAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
        this.leftAt = null;
    }

    public UUID getId() { return id; }
    public UUID getConversationId() { return conversationId; }
    public UUID getUserId() { return userId; }
    public ParticipantType getParticipantType() { return participantType; }
    public Instant getLastReadAt() { return lastReadAt; }
    public Instant getJoinedAt() { return joinedAt; }
    public Instant getLeftAt() { return leftAt; }
}
