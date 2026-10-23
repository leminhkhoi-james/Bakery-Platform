package com.se193262.chatservice.feature.conversation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByCakeRequestIdAndBakeryId(UUID cakeRequestId, UUID bakeryId);

    @Query("""
            select c from Conversation c
            where exists (
                select p.id from ConversationParticipant p
                where p.conversationId = c.id and p.userId = :userId and p.leftAt is null
            )
            and (:status is null or c.status = :status)
            order by coalesce(c.lastMessageAt, c.createdAt) desc, c.id desc
            """)
    Page<Conversation> findVisibleTo(
            @Param("userId") UUID userId,
            @Param("status") ConversationStatus status,
            Pageable pageable);

    @Query("""
            select c from Conversation c
            where c.bakeryId = :bakeryId
              and (:status is null or c.status = :status)
            order by coalesce(c.lastMessageAt, c.createdAt) desc, c.id desc
            """)
    Page<Conversation> findByBakery(
            @Param("bakeryId") UUID bakeryId,
            @Param("status") ConversationStatus status,
            Pageable pageable);
}
