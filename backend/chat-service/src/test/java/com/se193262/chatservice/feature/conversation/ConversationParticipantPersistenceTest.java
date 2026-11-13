package com.se193262.chatservice.feature.conversation;

import com.se193262.chatservice.exception.ChatException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationParticipantPersistenceTest {
    @Mock ConversationRepository conversations;
    @Mock ConversationParticipantRepository participants;
    private ConversationPersistenceService service;
    private Conversation conversation;
    private final UUID conversationId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ConversationPersistenceService(conversations, participants);
        conversation = new Conversation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        ReflectionTestUtils.setField(conversation, "id", conversationId);
    }

    @Test
    void repeatedJoinKeepsReadMarkerAndJoinTime() {
        ConversationParticipant existing = new ConversationParticipant(conversationId, userId, ParticipantType.BAKERY_OWNER);
        Instant joined = existing.getJoinedAt();
        Instant read = joined.plusSeconds(20);
        existing.markRead(read);
        when(conversations.findByIdForParticipantUpdate(conversationId)).thenReturn(Optional.of(conversation));
        when(participants.findByConversationIdAndUserId(conversationId, userId)).thenReturn(Optional.of(existing));
        service.addParticipant(conversation, userId, ParticipantType.BAKERY_OWNER);
        service.addParticipant(conversation, userId, ParticipantType.BAKERY_OWNER);
        assertEquals(joined, existing.getJoinedAt());
        assertEquals(read, existing.getLastReadAt());
        verify(participants, never()).save(any());
    }

    @Test
    void missingConversationCannotCreateOrReactivateParticipant() {
        when(conversations.findByIdForParticipantUpdate(conversationId)).thenReturn(Optional.empty());
        assertThrows(ChatException.class, () -> service.addParticipant(conversation, userId, ParticipantType.BAKERY_OWNER));
        verifyNoInteractions(participants);
    }

    @Test
    void reactivationPreservesReadMarkerAndRestoresMembership() {
        ConversationParticipant existing = new ConversationParticipant(conversationId, userId, ParticipantType.BAKERY_OWNER);
        Instant read = Instant.now().minusSeconds(60);
        existing.markRead(read);
        ReflectionTestUtils.setField(existing, "leftAt", Instant.now().minusSeconds(30));
        when(conversations.findByIdForParticipantUpdate(conversationId)).thenReturn(Optional.of(conversation));
        when(participants.findByConversationIdAndUserId(conversationId, userId)).thenReturn(Optional.of(existing));
        service.addParticipant(conversation, userId, ParticipantType.BAKERY_OWNER);
        assertNull(existing.getLeftAt());
        assertEquals(ParticipantType.BAKERY_OWNER, existing.getParticipantType());
        assertEquals(read, existing.getLastReadAt());
        verify(participants, never()).save(any());
    }
}
