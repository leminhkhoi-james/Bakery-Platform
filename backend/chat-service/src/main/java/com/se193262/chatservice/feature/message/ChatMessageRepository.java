package com.se193262.chatservice.feature.message;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Optional<ChatMessage> findByClientMessageId(UUID clientMessageId);

    Optional<ChatMessage> findByIdAndConversationId(UUID id, UUID conversationId);

    @Query("""
            select m from ChatMessage m
            where m.conversationId = :conversationId
              and (:beforeTime is null or m.createdAt < :beforeTime
                   or (m.createdAt = :beforeTime and m.id < :beforeId))
            order by m.createdAt desc, m.id desc
            """)
    List<ChatMessage> findPageBefore(
            @Param("conversationId") UUID conversationId,
            @Param("beforeTime") Instant beforeTime,
            @Param("beforeId") UUID beforeId,
            Pageable pageable);

    @Query("""
            select count(m) from ChatMessage m
            where m.conversationId = :conversationId
              and m.senderParticipantId <> :participantId
              and m.createdAt >= :joinedAt
              and not exists (
                  select r.id from MessageReceipt r
                  where r.id.messageId = m.id
                    and r.id.participantId = :participantId
                    and r.readAt is not null
              )
            """)
    long countUnread(
            @Param("conversationId") UUID conversationId,
            @Param("participantId") UUID participantId,
            @Param("joinedAt") Instant joinedAt);

    @Query("""
            select m from ChatMessage m
            where m.conversationId = :conversationId
            order by m.createdAt desc, m.id desc
            """)
    List<ChatMessage> findLatest(
            @Param("conversationId") UUID conversationId,
            Pageable pageable);

    @Modifying
    @Query(value = """
            insert into message_receipts (message_id, participant_id, delivered_at, read_at)
            select m.id, :participantId, current_timestamp, current_timestamp
            from messages m
            where m.conversation_id = :conversationId
              and m.sender_participant_id <> :participantId
              and (m.created_at < :throughCreatedAt
                   or (m.created_at = :throughCreatedAt and m.id <= :throughMessageId))
            on conflict (message_id, participant_id) do update
            set delivered_at = coalesce(message_receipts.delivered_at, excluded.delivered_at),
                read_at = greatest(message_receipts.read_at, excluded.read_at)
            """, nativeQuery = true)
    void markReadThrough(
            @Param("conversationId") UUID conversationId,
            @Param("participantId") UUID participantId,
            @Param("throughCreatedAt") Instant throughCreatedAt,
            @Param("throughMessageId") UUID throughMessageId);
}
