package com.se193262.chatservice.feature.message;

import com.se193262.chatservice.config.StorageProperties;
import com.se193262.chatservice.exception.ChatException;
import com.se193262.chatservice.feature.conversation.Conversation;
import com.se193262.chatservice.feature.conversation.ConversationParticipant;
import com.se193262.chatservice.feature.conversation.ConversationParticipantRepository;
import com.se193262.chatservice.feature.conversation.ConversationService;
import com.se193262.chatservice.feature.conversation.ConversationStatus;
import com.se193262.chatservice.feature.message.dto.AttachmentResponse;
import com.se193262.chatservice.feature.message.dto.MessageMetadata;
import com.se193262.chatservice.feature.message.dto.MessagePageResponse;
import com.se193262.chatservice.feature.message.dto.MessageResponse;
import com.se193262.chatservice.feature.message.dto.ReadMessagesResponse;
import com.se193262.chatservice.infrastructure.storage.StorageUnavailableException;
import com.se193262.chatservice.infrastructure.storage.AttachmentStorage;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final ConversationService conversationService;
    private final ChatMessageRepository messageRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final MessagePersistenceService persistenceService;
    private final AttachmentValidator attachmentValidator;
    private final AttachmentStorage attachmentStorage;
    private final StorageProperties storageProperties;

    public MessageService(
            ConversationService conversationService,
            ChatMessageRepository messageRepository,
            ConversationParticipantRepository participantRepository,
            MessageAttachmentRepository attachmentRepository,
            MessagePersistenceService persistenceService,
            AttachmentValidator attachmentValidator,
            AttachmentStorage attachmentStorage,
            StorageProperties storageProperties) {
        this.conversationService = conversationService;
        this.messageRepository = messageRepository;
        this.participantRepository = participantRepository;
        this.attachmentRepository = attachmentRepository;
        this.persistenceService = persistenceService;
        this.attachmentValidator = attachmentValidator;
        this.attachmentStorage = attachmentStorage;
        this.storageProperties = storageProperties;
    }

    public MessageCreation send(
            UUID conversationId,
            UUID userId,
            Set<String> roles,
            MessageMetadata metadata,
            List<MultipartFile> files) {
        Conversation conversation = conversationService.getConversation(conversationId);
        ConversationParticipant sender = conversationService.requireParticipant(
                conversation, userId, roles, null);
        List<AttachmentFile> attachments = attachmentValidator.validate(metadata.messageType(), files);
        String content = normalizeContent(metadata.content());
        if (metadata.messageType() == MessageType.TEXT && (content == null || content.isBlank())) {
            throw invalid("Text messages require non-blank content");
        }
        String fingerprint = fingerprint(metadata.messageType(), content, attachments);
        ChatMessage existing = messageRepository.findByClientMessageId(metadata.clientMessageId()).orElse(null);
        if (existing != null) {
            return new MessageCreation(validateReplay(existing, conversationId, sender, fingerprint), true);
        }
        if (conversation.getStatus() != ConversationStatus.OPEN) {
            throw new ChatException(HttpStatus.CONFLICT, "Messages cannot be sent to a closed conversation");
        }
        try {
            return new MessageCreation(persistenceService.create(
                    conversation, sender, metadata.clientMessageId(), metadata.messageType(),
                    content, fingerprint, attachments), false);
        } catch (DataIntegrityViolationException exception) {
            ChatMessage replay = messageRepository.findByClientMessageId(metadata.clientMessageId())
                    .orElseThrow(() -> exception);
            return new MessageCreation(validateReplay(replay, conversationId, sender, fingerprint), true);
        }
    }

    public MessagePageResponse list(
            UUID conversationId, UUID userId, Set<String> roles, String before, int limit) {
        Conversation conversation = conversationService.getConversation(conversationId);
        ConversationParticipant participant =
                conversationService.requireParticipant(conversation, userId, roles, null);
        Cursor cursor = before == null || before.isBlank() ? null : decodeCursor(before);
        List<ChatMessage> fetched = messageRepository.findPageBefore(
                conversationId,
                cursor == null ? null : cursor.createdAt(),
                cursor == null ? null : cursor.id(),
                PageRequest.of(0, limit + 1));
        boolean hasMore = fetched.size() > limit;
        List<ChatMessage> messages = hasMore ? fetched.subList(0, limit) : fetched;
        messages.stream()
                .filter(message -> !message.getSenderParticipantId().equals(participant.getId()))
                .forEach(message -> persistenceService.markDelivered(message, participant.getId()));
        String nextCursor = hasMore && !messages.isEmpty()
                ? encodeCursor(messages.getLast())
                : null;
        return new MessagePageResponse(toResponses(messages), nextCursor, hasMore);
    }

    public ReadMessagesResponse markRead(
            UUID conversationId, UUID userId, Set<String> roles, UUID throughMessageId) {
        Conversation conversation = conversationService.getConversation(conversationId);
        ConversationParticipant participant =
                conversationService.requireParticipant(conversation, userId, roles, null);
        ChatMessage message = messageRepository.findByIdAndConversationId(throughMessageId, conversationId)
                .orElseGet(() -> {
                    if (messageRepository.existsById(throughMessageId)) {
                        throw invalid("The read position belongs to another conversation");
                    }
                    throw new ChatException(HttpStatus.NOT_FOUND, "Message not found");
                });
        Instant lastReadAt = persistenceService.markRead(conversationId, participant.getId(), message);
        return new ReadMessagesResponse(conversationId, lastReadAt);
    }

    public void delete(
            UUID conversationId, UUID messageId, UUID userId, Set<String> roles) {
        Conversation conversation = conversationService.getConversation(conversationId);
        conversationService.requireParticipant(conversation, userId, roles, null);
        persistenceService.deleteMessage(conversationId, messageId, userId);
    }

    private List<MessageResponse> toResponses(List<ChatMessage> messages) {
        if (messages.isEmpty()) {
            return List.of();
        }
        List<UUID> messageIds = messages.stream().map(ChatMessage::getId).toList();
        Map<UUID, ConversationParticipant> senders = participantRepository
                .findAllById(messages.stream().map(ChatMessage::getSenderParticipantId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(ConversationParticipant::getId, Function.identity()));
        Map<UUID, List<MessageAttachment>> attachments = attachmentRepository
                .findByMessageIdInOrderByDisplayOrder(messageIds)
                .stream()
                .collect(Collectors.groupingBy(MessageAttachment::getMessageId));
        return messages.stream()
                .map(message -> {
                    boolean deleted = message.getDeletedAt() != null;
                    List<AttachmentResponse> files = deleted ? List.of()
                            : attachments.getOrDefault(message.getId(), List.of()).stream()
                            .map(attachment -> new AttachmentResponse(
                                    attachment.getId(),
                                    attachment.getOriginalFileName(),
                                    attachment.getMediaType(),
                                    attachment.getFileSize(),
                                    attachmentStorage.signedGetUrl(
                                            attachment.getObjectKey(),
                                            storageProperties.presignedUrlExpiry())))
                            .toList();
                    ConversationParticipant sender = senders.get(message.getSenderParticipantId());
                    return new MessageResponse(
                            message.getId(),
                            message.getClientMessageId(),
                            sender == null ? null : sender.getUserId(),
                            message.getMessageType(),
                            deleted ? null : message.getContent(),
                            message.getCreatedAt(),
                            message.getEditedAt(),
                            deleted,
                            files);
                })
                .toList();
    }

    public MessageResponse response(ChatMessage message) {
        try {
            return toResponses(List.of(message)).getFirst();
        } catch (StorageUnavailableException exception) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE, "Attachment storage is unavailable");
        }
    }

    private ChatMessage validateReplay(
            ChatMessage message, UUID conversationId, ConversationParticipant sender, String fingerprint) {
        if (!message.getConversationId().equals(conversationId)
                || !message.getSenderParticipantId().equals(sender.getId())
                || !message.getPayloadFingerprint().equals(fingerprint)) {
            throw new ChatException(HttpStatus.CONFLICT,
                    "clientMessageId was already used with a different message payload");
        }
        return message;
    }

    private String fingerprint(MessageType type, String content, List<AttachmentFile> files) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(type.name().getBytes(StandardCharsets.UTF_8));
            digest.update((byte) 0);
            digest.update(content == null ? new byte[0] : content.getBytes(StandardCharsets.UTF_8));
            for (AttachmentFile file : files) {
                digest.update((byte) 0);
                digest.update(file.originalFileName().getBytes(StandardCharsets.UTF_8));
                digest.update((byte) 0);
                digest.update(file.mediaType().getBytes(StandardCharsets.UTF_8));
                digest.update(ByteBuffer.allocate(Long.BYTES).putLong(file.size()).array());
                digest.update(file.content());
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime", exception);
        }
    }

    private String encodeCursor(ChatMessage message) {
        String value = message.getCreatedAt() + "|" + message.getId();
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private Cursor decodeCursor(String encoded) {
        try {
            String value = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
            String[] parts = value.split("\\|", -1);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid cursor");
            }
            return new Cursor(Instant.parse(parts[0]), UUID.fromString(parts[1]));
        } catch (IllegalArgumentException | DateTimeParseException exception) {
            throw new ChatException(HttpStatus.BAD_REQUEST, "The message cursor is invalid");
        }
    }

    private String normalizeContent(String content) {
        return content == null || content.isBlank() ? null : content;
    }

    private ChatException invalid(String message) {
        return new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }

    public record MessageCreation(ChatMessage message, boolean replayed) {
    }

    private record Cursor(Instant createdAt, UUID id) {
    }
}
