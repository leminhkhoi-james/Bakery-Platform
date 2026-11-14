package com.se193262.chatservice.infrastructure.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Service
public class ChatProfileService {
    private static final Logger log = LoggerFactory.getLogger(ChatProfileService.class);
    private final IdentityChatClient identity;
    private final BakeryChatClient bakery;

    public ChatProfileService(IdentityChatClient identity, BakeryChatClient bakery) {
        this.identity = identity;
        this.bakery = bakery;
    }

    public String name(UUID userId) {
        if (userId == null) return null;
        try {
            var profile = identity.profile(userId);
            return profile != null && userId.equals(profile.id()) ? profile.displayName() : null;
        } catch (RestClientException | com.se193262.chatservice.exception.ChatException exception) {
            log.debug("Chat display name lookup unavailable for user {}", userId);
            return null;
        }
    }

    public BakeryNames bakeryNames(UUID bakeryId) {
        try {
            var profile = bakery.profile(bakeryId);
            if (profile != null && bakeryId.equals(profile.id())) {
                return new BakeryNames(profile.name(), name(profile.ownerUserId()));
            }
        } catch (RestClientException | com.se193262.chatservice.exception.ChatException exception) {
            log.debug("Chat bakery profile lookup unavailable for bakery {}", bakeryId);
        }
        return new BakeryNames(null, null);
    }

    public record BakeryNames(String bakeryName, String ownerName) { }
}
