package com.se193262.chatservice.feature.conversation;

import com.se193262.chatservice.exception.ChatException;
import com.se193262.chatservice.feature.message.ChatMessageRepository;
import com.se193262.chatservice.infrastructure.client.BakeryChatClient;
import com.se193262.chatservice.infrastructure.client.ChatContextService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationOwnerAuthorizationTest {
    @Mock ConversationRepository conversations;
    @Mock ConversationParticipantRepository participants;
    @Mock ConversationPersistenceService persistence;
    @Mock ChatMessageRepository messages;
    @Mock ChatContextService context;
    private ConversationService service;
    private final UUID bakeryId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        service = new ConversationService(conversations, participants, persistence, messages, context);
        conversation = new Conversation(UUID.randomUUID(), UUID.randomUUID(), bakeryId);
    }

    @Test
    @DisplayName("Customer JWT cannot join a bakery conversation")
    void requireParticipant_withCustomerToken_isRejected() {
        assertThrows(ChatException.class, () -> service.requireParticipant(
                conversation, userId, Set.of("CUSTOMER"), null));
        verifyNoInteractions(context, persistence);
    }

    @Test
    @DisplayName("Owner JWT with invalid membership cannot join a conversation")
    void requireParticipant_withInvalidMembership_isRejected() {
        when(context.authorizeBakeryMember(bakeryId, userId, null))
                .thenReturn(new BakeryChatClient.MembershipAuthorizationResponse(
                        bakeryId, userId, true, "INVALID", true));
        assertThrows(ChatException.class, () -> service.requireParticipant(
                conversation, userId, Set.of("BAKERY_OWNER"), null));
        verifyNoInteractions(persistence);
    }

    @Test
    @DisplayName("Active bakery owner can join a conversation")
    void requireParticipant_withOwnerMembership_addsOwnerParticipant() {
        when(context.authorizeBakeryMember(bakeryId, userId, null))
                .thenReturn(new BakeryChatClient.MembershipAuthorizationResponse(
                        bakeryId, userId, true, "OWNER", true));
        when(participants.findByConversationIdAndUserId(any(), eq(userId)))
                .thenReturn(Optional.empty(), Optional.of(new ConversationParticipant(
                        null, userId, ParticipantType.BAKERY_OWNER)));
        service.requireParticipant(conversation, userId, Set.of("BAKERY_OWNER"), null);
        verify(persistence).addParticipant(conversation, userId, ParticipantType.BAKERY_OWNER);
    }
}
