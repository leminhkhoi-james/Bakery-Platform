package com.se193262.chatservice.feature.message;

import com.se193262.chatservice.exception.ChatException;
import com.se193262.chatservice.feature.conversation.Conversation;
import com.se193262.chatservice.feature.conversation.ConversationParticipant;
import com.se193262.chatservice.feature.conversation.ConversationParticipantRepository;
import com.se193262.chatservice.feature.conversation.ConversationRepository;
import com.se193262.chatservice.infrastructure.storage.AttachmentStorage;
import com.se193262.chatservice.infrastructure.storage.StorageUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MessagePersistenceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MessagePersistenceService.class);

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ChatMessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final MessageReceiptRepository receiptRepository;
    private final AttachmentStorage attachmentStorage;

    public MessagePersistenceService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            ChatMessageRepository messageRepository,
            MessageAttachmentRepository attachmentRepository,
            MessageReceiptRepository receiptRepository,
            AttachmentStorage attachmentStorage) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.attachmentRepository = attachmentRepository;
        this.receiptRepository = receiptRepository;
        this.attachmentStorage = attachmentStorage;
    }

    @Transactional
    public ChatMessage create(
            Conversation conversation,
            ConversationParticipant sender,
            UUID clientMessageId,
            MessageType type,
            String content,
            String fingerprint,
            List<AttachmentFile> files) {
        ChatMessage message = messageRepository.saveAndFlush(
                new ChatMessage(conversation.getId(), sender.getId(), clientMessageId,
                        fingerprint, type, content));
        List<String> uploadedKeys = new ArrayList<>();
        registerRollbackCleanup(uploadedKeys);
        try {
            int displayOrder = 0;
            for (AttachmentFile file : files) {
                String objectKey = "conversations/" + conversation.getId() + "/messages/"
                        + message.getId() + "/" + UUID.randomUUID();
                attachmentStorage.put(objectKey, new ByteArrayInputStream(file.content()),
                        file.size(), file.mediaType());
                uploadedKeys.add(objectKey);
                attachmentRepository.save(new MessageAttachment(
                        message.getId(), objectKey, file.originalFileName(), file.mediaType(),
                        file.size(), displayOrder++));
            }
            for (ConversationParticipant recipient :
                    participantRepository.findByConversationIdAndLeftAtIsNull(conversation.getId())) {
                if (!recipient.getId().equals(sender.getId())) {
                    receiptRepository.save(new MessageReceipt(
                            new MessageReceiptId(message.getId(), recipient.getId()), null));
                }
            }
            conversation.recordMessage(message.getCreatedAt());
            conversationRepository.save(conversation);
            return message;
        } catch (StorageUnavailableException exception) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Attachment storage is unavailable");
        }
    }

    @Transactional
    public ChatMessage markDeleted(ChatMessage message) {
        List<MessageAttachment> attachments =
                attachmentRepository.findByMessageIdOrderByDisplayOrder(message.getId());
        message.delete(Instant.now().truncatedTo(ChronoUnit.MICROS));
        registerAfterCommitCleanup(attachments.stream().map(MessageAttachment::getObjectKey).toList());
        return message;
    }

    @Transactional
    public Instant markRead(UUID conversationId, UUID participantId, ChatMessage throughMessage) {
        ConversationParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Conversation not found"));
        participant.markRead(throughMessage.getCreatedAt());
        messageRepository.markReadThrough(
                conversationId, participantId, throughMessage.getCreatedAt(), throughMessage.getId());
        return participant.getLastReadAt();
    }

    @Transactional
    public void markDelivered(ChatMessage message, UUID participantId) {
        receiptRepository.markDeliveredIfMissing(message.getId(), participantId);
    }

    @Transactional
    public void deleteMessage(UUID conversationId, UUID messageId, UUID senderId) {
        ChatMessage message = messageRepository.findByIdAndConversationId(messageId, conversationId)
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Message not found"));
        ConversationParticipant sender = participantRepository.findById(message.getSenderParticipantId())
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Message not found"));
        if (!sender.getUserId().equals(senderId)) {
            throw new ChatException(HttpStatus.FORBIDDEN, "Only the sender can delete this message");
        }
        if (message.getDeletedAt() == null) {
            markDeleted(message);
        }
    }

    private void registerRollbackCleanup(List<String> objectKeys) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    cleanup(List.copyOf(objectKeys));
                }
            }
        });
    }

    private void registerAfterCommitCleanup(List<String> objectKeys) {
        if (objectKeys.isEmpty()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                cleanup(objectKeys);
            }
        });
    }

    private void cleanup(List<String> objectKeys) {
        for (String objectKey : objectKeys) {
            try {
                attachmentStorage.delete(objectKey);
            } catch (StorageUnavailableException exception) {
                LOGGER.error("Could not clean up chat attachment object {}", objectKey, exception);
            }
        }
    }
}
