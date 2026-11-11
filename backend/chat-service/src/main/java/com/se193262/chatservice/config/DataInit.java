package com.se193262.chatservice.config;

import com.se193262.chatservice.feature.conversation.Conversation;
import com.se193262.chatservice.feature.conversation.ConversationParticipant;
import com.se193262.chatservice.feature.conversation.ConversationParticipantRepository;
import com.se193262.chatservice.feature.conversation.ConversationRepository;
import com.se193262.chatservice.feature.conversation.ConversationStatus;
import com.se193262.chatservice.feature.conversation.ParticipantType;
import com.se193262.chatservice.feature.message.ChatMessage;
import com.se193262.chatservice.feature.message.ChatMessageRepository;
import com.se193262.chatservice.feature.message.MessageReceipt;
import com.se193262.chatservice.feature.message.MessageReceiptId;
import com.se193262.chatservice.feature.message.MessageReceiptRepository;
import com.se193262.chatservice.feature.message.MessageType;
import java.util.Map;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInit implements CommandLineRunner {
    private static final String[] CONTENTS = {"Chào tiệm, mình muốn đặt bánh ít ngọt, giao vào buổi chiều.", "Dạ được ạ, tiệm đã gửi báo giá. Bạn xem giúp tiệm nhé!", "Cảm ơn tiệm, mình sẽ kiểm tra và phản hồi sớm."};
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository conversationParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageReceiptRepository messageReceiptRepository;

    public DataInit(ConversationRepository conversationRepository,
            ConversationParticipantRepository conversationParticipantRepository,
            ChatMessageRepository chatMessageRepository,
            MessageReceiptRepository messageReceiptRepository) {
        this.conversationRepository = conversationRepository;
        this.conversationParticipantRepository = conversationParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.messageReceiptRepository = messageReceiptRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Instant now = Instant.now();
        int[][] references = {{2, 1}, {2, 2}, {3, 3}, {5, 1}};
        for (int index = 0; index < references.length; index++) {
            seedConversation(index + 1, references[index][0], references[index][1], now);
        }
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: 4 seed conversations and 12 text messages");
    }

    private void seedConversation(int number, int request, int bakery, Instant now) {
        int customer = 11 + (request - 1) % 6;
        if (!conversationRepository.existsById(id(60, number))) {
            Conversation demoConversation = new Conversation();
            demoConversation.setId(id(60, number));
            demoConversation.setCakeRequestId(id(40, request));
            demoConversation.setOrderId(number == 4 ? id(50, 8) : null);
            demoConversation.setCustomerId(id(1, customer));
            demoConversation.setBakeryId(id(10, bakery));
            demoConversation.setStatus(ConversationStatus.valueOf("OPEN"));
            demoConversation.setLastMessageAt(now.minusSeconds(60));
            demoConversation.setCreatedAt(now.minus(2, ChronoUnit.DAYS));
            demoConversation.setUpdatedAt(now.minusSeconds(60));
            conversationRepository.save(demoConversation);
        }
        for (int participant = 0; participant < 2; participant++) {
            if (!conversationParticipantRepository.existsById(id(61, number * 2 - 1 + participant))) {
                ConversationParticipant demoConversationParticipant = new ConversationParticipant();
                demoConversationParticipant.setId(id(61, number * 2 - 1 + participant));
                demoConversationParticipant.setConversationId(id(60, number));
                demoConversationParticipant.setUserId(id(1, participant == 0 ? customer : 20 + bakery));
                demoConversationParticipant.setParticipantType(ParticipantType.valueOf(participant == 0 ? "CUSTOMER" : "BAKERY_OWNER"));
                demoConversationParticipant.setJoinedAt(now.minus(2, ChronoUnit.DAYS));
                demoConversationParticipant.setLastReadAt(now.minusSeconds(90));
                conversationParticipantRepository.save(demoConversationParticipant);
            }
        }
        String[] contents = {"Chào tiệm, mình muốn đặt bánh sinh nhật Demo.", "Tiệm đã nhận yêu cầu mẫu và gửi báo giá nhé!", "Mình đã xem báo giá, cảm ơn tiệm."};
        for (int index = 0; index < contents.length; index++) {
            int message = (number - 1) * 3 + index + 1;
            UUID sender = id(61, number * 2 - (index == 1 ? 0 : 1));
            int messageIndex = index;
            chatMessageRepository.findById(id(62, message)).ifPresent(existing -> {
                if (existing.getEditedAt() == null && existing.getDeletedAt() == null && contents[messageIndex].equals(existing.getContent())) {
                    existing.setContent(CONTENTS[messageIndex]);
                    existing.setPayloadFingerprint(fingerprint(CONTENTS[messageIndex]));
                }
            });
            if (!chatMessageRepository.existsById(id(62, message))) {
                ChatMessage demoChatMessage = new ChatMessage();
                demoChatMessage.setId(id(62, message));
                demoChatMessage.setConversationId(id(60, number));
                demoChatMessage.setSenderParticipantId(sender);
                demoChatMessage.setClientMessageId(id(63, message));
                demoChatMessage.setPayloadFingerprint(fingerprint(CONTENTS[index]));
                demoChatMessage.setMessageType(MessageType.valueOf("TEXT"));
                demoChatMessage.setContent(CONTENTS[index]);
                demoChatMessage.setCreatedAt(now.minusSeconds((3 - index) * 60L));
                chatMessageRepository.save(demoChatMessage);
            }
            if (index < 2) {
                UUID recipient = id(61, number * 2 - (index == 1 ? 1 : 0));
                if (!messageReceiptRepository.existsById(new MessageReceiptId(id(62, message), recipient))) {
                    MessageReceipt demoMessageReceipt = new MessageReceipt(new MessageReceiptId(id(62, message), recipient), now.minusSeconds(150 - index * 20L));
                    demoMessageReceipt.markRead(now.minusSeconds(90));
                    messageReceiptRepository.save(demoMessageReceipt);
                }
            }
        }
    }

    private String fingerprint(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update("TEXT".getBytes(StandardCharsets.UTF_8));
            digest.update((byte) 0);
            return HexFormat.of().formatHex(digest.digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime", exception);
        }
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }
}
