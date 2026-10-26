package com.se193262.chatservice.feature.conversation;

import com.se193262.chatservice.exception.ChatException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ConversationPersistenceService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;

    public ConversationPersistenceService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public Conversation create(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        Conversation conversation = conversationRepository.saveAndFlush(
                new Conversation(cakeRequestId, customerId, bakeryId));
        participantRepository.save(new ConversationParticipant(
                conversation.getId(), customerId, ParticipantType.CUSTOMER));
        return conversation;
    }

    @Transactional
    public void addParticipant(Conversation conversation, UUID userId, ParticipantType type) {
        ConversationParticipant participant = participantRepository
                .findByConversationIdAndUserId(conversation.getId(), userId)
                .orElse(null);
        if (participant == null) {
            participantRepository.save(new ConversationParticipant(conversation.getId(), userId, type));
        } else if (participant.getLeftAt() != null) {
            participant.reactivate(type);
        }
    }

    @Transactional
    public Conversation close(Conversation conversation, String reason) {
        Conversation managed = conversationRepository.findById(conversation.getId())
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (managed.getStatus() == ConversationStatus.ARCHIVED) {
            throw new ChatException(HttpStatus.CONFLICT, "An archived conversation cannot be closed");
        }
        if (managed.getStatus() == ConversationStatus.OPEN) {
            managed.close(reason);
        }
        return managed;
    }
}
