package com.se193262.chatservice.feature.conversation;

import com.se193262.chatservice.exception.ChatException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ConversationPersistenceService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final JdbcClient jdbc;

    public ConversationPersistenceService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository, JdbcClient jdbc) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.jdbc = jdbc;
    }

    @Transactional
    public ConversationService.ConversationCreation findOrCreate(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        // Serialize creation for a pair even when requests arrive for different cake requests.
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended(:pair, 0))")
                .param("pair", "chat:" + customerId + ":" + bakeryId)
                .query((row, index) -> Boolean.TRUE).single();
        var existing = conversationRepository.findFirstByCustomerIdAndBakeryIdAndStatusOrderByCreatedAtAscIdAsc(
                customerId, bakeryId, ConversationStatus.OPEN)
                .or(() -> conversationRepository.findByCakeRequestIdAndBakeryId(cakeRequestId, bakeryId));
        if (existing.isPresent()) {
            if (!existing.get().getCustomerId().equals(customerId)) {
                throw new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, "Conversation context is invalid");
            }
            return new ConversationService.ConversationCreation(existing.get(), true);
        }
        Conversation conversation = conversationRepository.saveAndFlush(
                new Conversation(cakeRequestId, customerId, bakeryId));
        participantRepository.save(new ConversationParticipant(
                conversation.getId(), customerId, ParticipantType.CUSTOMER));
        return new ConversationService.ConversationCreation(conversation, false);
    }

    @Transactional
    public void addParticipant(Conversation conversation, UUID userId, ParticipantType type) {
        // List and detail requests can join the same owner concurrently. Lock the
        // parent before checking membership so the unique pair is inserted once.
        conversationRepository.findByIdForParticipantUpdate(conversation.getId())
                .orElseThrow(() -> new ChatException(HttpStatus.NOT_FOUND, "Conversation not found"));
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
