package com.se193262.chatservice.feature.message;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, UUID> {

    List<MessageAttachment> findByMessageIdOrderByDisplayOrder(UUID messageId);

    List<MessageAttachment> findByMessageIdInOrderByDisplayOrder(List<UUID> messageIds);
}
