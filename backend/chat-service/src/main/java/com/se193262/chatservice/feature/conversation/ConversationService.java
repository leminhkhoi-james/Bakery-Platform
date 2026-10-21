package com.se193262.chatservice.feature.conversation;

import com.se193262.chatservice.exception.ChatException;
import com.se193262.chatservice.feature.conversation.dto.ConversationResponse;
import com.se193262.chatservice.feature.conversation.dto.ConversationSummaryResponse;
import com.se193262.chatservice.feature.conversation.dto.ParticipantResponse;
import com.se193262.chatservice.feature.message.ChatMessage;
import com.se193262.chatservice.feature.message.ChatMessageRepository;
import com.se193262.chatservice.infrastructure.client.BakeryChatClient;
import com.se193262.chatservice.infrastructure.client.ChatContextService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ConversationPersistenceService persistenceService;
    private final ChatMessageRepository messageRepository;
    private final ChatContextService contextService;

    public ConversationService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            ConversationPersistenceService persistenceService,
            ChatMessageRepository messageRepository,
            ChatContextService contextService) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.persistenceService = persistenceService;
        this.messageRepository = messageRepository;
        this.contextService = contextService;
    }

    public ConversationCreation create(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        Conversation existing = conversationRepository
                .findByCakeRequestIdAndBakeryId(cakeRequestId, bakeryId)
                .orElse(null);
        if (existing != null) {
            if (!existing.getCustomerId().equals(customerId)) {
                throw invalidContext();
            }
            ensureCustomerParticipant(existing, customerId);
            return new ConversationCreation(existing, true);
        }
        contextService.authorizeConversation(cakeRequestId, customerId, bakeryId);
        return createNew(cakeRequestId, customerId, bakeryId);
    }

    public ConversationResponse get(UUID conversationId, UUID userId, Set<String> roles) {
        Conversation conversation = getConversation(conversationId);
        ConversationParticipant participant = requireParticipant(conversation, userId, roles, null);
        return toResponse(conversation, participant);
    }

    public ConversationResponse close(
            UUID conversationId, UUID userId, Set<String> roles, String reason) {
        Conversation conversation = getConversation(conversationId);
        if (conversation.getCustomerId().equals(userId)) {
            requireParticipant(conversation, userId, roles, null);
        } else {
            requireBakeryManager(conversation, userId, roles);
        }
        return toResponse(persistenceService.close(conversation, reason),
                participantRepository.findByConversationIdAndUserId(conversationId, userId)
                        .orElseThrow(ConversationService::notFound));
    }

    public ConversationPage list(
            UUID userId, Set<String> roles, ConversationStatus status, UUID bakeryId, int page, int size) {
        Page<Conversation> conversations = findPage(userId, roles, status, bakeryId, page, size);
        List<ConversationSummaryResponse> results = conversations.getContent().stream()
                .map(conversation -> {
                    ConversationParticipant participant =
                            bakeryId == null
                                    ? requireParticipant(conversation, userId, roles, null)
                                    : participantRepository.findByConversationIdAndUserId(
                                                    conversation.getId(), userId)
                                            .filter(item -> item.getLeftAt() == null)
                                            .orElseThrow(ConversationService::notFound);
                    String preview = messageRepository.findLatest(conversation.getId(), PageRequest.of(0, 1))
                            .stream().findFirst().map(ConversationService::preview).orElse(null);
                    long unread = messageRepository.countUnread(
                            conversation.getId(), participant.getId(), participant.getJoinedAt());
                    return new ConversationSummaryResponse(
                            conversation.getId(),
                            conversation.getCakeRequestId(),
                            conversation.getOrderId(),
                            conversation.getCustomerId(),
                            conversation.getBakeryId(),
                            conversation.getStatus(),
                            conversation.getLastMessageAt(),
                            unread,
                            preview);
                })
                .toList();
        return new ConversationPage(
                results, new PageInfo(page, size, conversations.getTotalPages(), conversations.getTotalElements()));
    }

    public ConversationParticipant requireParticipant(
            Conversation conversation, UUID userId, Set<String> roles, String requiredBakeryRole) {
        ConversationParticipant existing = participantRepository
                .findByConversationIdAndUserId(conversation.getId(), userId)
                .filter(participant -> participant.getLeftAt() == null)
                .orElse(null);
        if (existing != null && existing.getParticipantType() == ParticipantType.CUSTOMER
                && conversation.getCustomerId().equals(userId)) {
            return existing;
        }
        if (conversation.getCustomerId().equals(userId)) {
            ensureCustomerParticipant(conversation, userId);
            return participantRepository.findByConversationIdAndUserId(conversation.getId(), userId)
                    .orElseThrow(ConversationService::notFound);
        }
        if (!roles.contains("BAKERY_OWNER") && !roles.contains("BAKERY_STAFF")) {
            throw notFound();
        }
        BakeryChatClient.MembershipAuthorizationResponse membership =
                contextService.authorizeBakeryMember(conversation.getBakeryId(), userId, requiredBakeryRole);
        if (!membership.active() || !membership.authorized()
                || !platformRoleMatches(roles, membership.memberRole())) {
            throw notFound();
        }
        ParticipantType participantType = switch (membership.memberRole()) {
            case "OWNER" -> ParticipantType.BAKERY_OWNER;
            case "MANAGER", "STAFF" -> ParticipantType.BAKERY_STAFF;
            default -> throw notFound();
        };
        persistenceService.addParticipant(conversation, userId, participantType);
        return participantRepository.findByConversationIdAndUserId(conversation.getId(), userId)
                .filter(participant -> participant.getLeftAt() == null)
                .orElseThrow(ConversationService::notFound);
    }

    public Conversation getConversation(UUID conversationId) {
        return conversationRepository.findById(conversationId).orElseThrow(ConversationService::notFound);
    }

    private ConversationCreation createNew(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        try {
            return new ConversationCreation(
                    persistenceService.create(cakeRequestId, customerId, bakeryId), false);
        } catch (DataIntegrityViolationException exception) {
            Conversation existing = conversationRepository
                    .findByCakeRequestIdAndBakeryId(cakeRequestId, bakeryId)
                    .orElseThrow(() -> exception);
            if (!existing.getCustomerId().equals(customerId)) {
                throw invalidContext();
            }
            return new ConversationCreation(existing, true);
        }
    }

    private Page<Conversation> findPage(
            UUID userId, Set<String> roles, ConversationStatus status, UUID bakeryId, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size);
        if (bakeryId == null) {
            return conversationRepository.findVisibleTo(userId, status, pageable);
        }
        if (!roles.contains("BAKERY_OWNER") && !roles.contains("BAKERY_STAFF")) {
            throw new ChatException(HttpStatus.FORBIDDEN, "Only bakery members can filter conversations by bakery");
        }
        BakeryChatClient.MembershipAuthorizationResponse membership =
                contextService.authorizeBakeryMember(bakeryId, userId, null);
        if (!membership.active() || !membership.authorized()
                || !platformRoleMatches(roles, membership.memberRole())) {
            throw notFound();
        }
        Page<Conversation> conversations = conversationRepository.findByBakery(bakeryId, status, pageable);
        ParticipantType type = participantType(membership.memberRole());
        conversations.getContent().forEach(conversation ->
                persistenceService.addParticipant(conversation, userId, type));
        return conversations;
    }

    private boolean platformRoleMatches(Set<String> roles, String memberRole) {
        return "OWNER".equals(memberRole)
                ? roles.contains("BAKERY_OWNER")
                : ("MANAGER".equals(memberRole) || "STAFF".equals(memberRole))
                && roles.contains("BAKERY_STAFF");
    }

    private ParticipantType participantType(String memberRole) {
        return switch (memberRole) {
            case "OWNER" -> ParticipantType.BAKERY_OWNER;
            case "MANAGER", "STAFF" -> ParticipantType.BAKERY_STAFF;
            default -> throw notFound();
        };
    }

    private void ensureCustomerParticipant(Conversation conversation, UUID customerId) {
        if (participantRepository.findByConversationIdAndUserId(conversation.getId(), customerId).isEmpty()) {
            persistenceService.addParticipant(conversation, customerId, ParticipantType.CUSTOMER);
        }
    }

    private void requireBakeryManager(Conversation conversation, UUID userId, Set<String> roles) {
        if (!roles.contains("BAKERY_OWNER") && !roles.contains("BAKERY_STAFF")) {
            throw notFound();
        }
        BakeryChatClient.MembershipAuthorizationResponse owner =
                contextService.authorizeBakeryMember(conversation.getBakeryId(), userId, "OWNER");
        boolean authorized = owner.active() && owner.authorized();
        if (!authorized) {
            BakeryChatClient.MembershipAuthorizationResponse manager =
                    contextService.authorizeBakeryMember(conversation.getBakeryId(), userId, "MANAGER");
            authorized = manager.active() && manager.authorized();
        }
        if (!authorized) {
            throw new ChatException(HttpStatus.FORBIDDEN, "Only bakery owners or managers can close this conversation");
        }
        requireParticipant(conversation, userId, roles, null);
    }

    private ConversationResponse toResponse(Conversation conversation, ConversationParticipant current) {
        List<ParticipantResponse> participants = participantRepository
                .findByConversationIdAndLeftAtIsNull(conversation.getId())
                .stream()
                .map(participant -> new ParticipantResponse(
                        participant.getUserId(),
                        participant.getParticipantType(),
                        participant.getJoinedAt(),
                        participant.getLastReadAt()))
                .toList();
        return new ConversationResponse(
                conversation.getId(),
                conversation.getCakeRequestId(),
                conversation.getOrderId(),
                conversation.getCustomerId(),
                conversation.getBakeryId(),
                conversation.getStatus(),
                conversation.getCloseReason(),
                conversation.getLastMessageAt(),
                conversation.getCreatedAt(),
                current.getLastReadAt(),
                participants);
    }

    private static String preview(ChatMessage message) {
        if (message.getDeletedAt() != null) {
            return "Message deleted";
        }
        return switch (message.getMessageType()) {
            case IMAGE -> "[Image]";
            case FILE -> "[File]";
            default -> message.getContent();
        };
    }

    private static ChatException invalidContext() {
        return new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, "Conversation context is invalid");
    }

    private static ChatException notFound() {
        return new ChatException(HttpStatus.NOT_FOUND, "Conversation not found");
    }

    public record ConversationCreation(Conversation conversation, boolean existing) {
    }

    public record PageInfo(int page, int size, int pages, long total) {
    }

    public record ConversationPage(List<ConversationSummaryResponse> results, PageInfo meta) {
    }
}
