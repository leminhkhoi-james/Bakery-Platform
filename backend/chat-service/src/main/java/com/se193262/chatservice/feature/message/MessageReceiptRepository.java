package com.se193262.chatservice.feature.message;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, MessageReceiptId> {

    @Modifying
    @Query(value = """
            insert into message_receipts (message_id, participant_id, delivered_at)
            values (:messageId, :participantId, current_timestamp)
            on conflict (message_id, participant_id) do nothing
            """, nativeQuery = true)
    void markDeliveredIfMissing(
            @Param("messageId") UUID messageId,
            @Param("participantId") UUID participantId);
}
