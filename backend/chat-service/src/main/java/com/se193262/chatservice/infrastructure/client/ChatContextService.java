package com.se193262.chatservice.infrastructure.client;

import com.se193262.chatservice.exception.ChatException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Service
public class ChatContextService {

    private final MarketplaceChatClient marketplaceClient;
    private final BakeryChatClient bakeryClient;

    public ChatContextService(MarketplaceChatClient marketplaceClient, BakeryChatClient bakeryClient) {
        this.marketplaceClient = marketplaceClient;
        this.bakeryClient = bakeryClient;
    }

    public void authorizeConversation(UUID cakeRequestId, UUID customerId, UUID bakeryId) {
        try {
            MarketplaceChatClient.ChatAuthorizationResponse authorization =
                    marketplaceClient.authorizeChat(cakeRequestId, customerId, bakeryId);
            if (authorization == null
                    || !cakeRequestId.equals(authorization.cakeRequestId())
                    || !customerId.equals(authorization.customerId())
                    || !bakeryId.equals(authorization.bakeryId())
                    || !authorization.authorized()) {
                throw new ChatException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "The request does not allow this customer and bakery to start a conversation");
            }
        } catch (ChatException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 404) {
                throw new ChatException(HttpStatus.UNPROCESSABLE_ENTITY, "The cake request does not exist");
            }
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Marketplace context authorization is unavailable");
        } catch (RestClientException exception) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Marketplace context authorization is unavailable");
        }
    }

    public BakeryChatClient.MembershipAuthorizationResponse authorizeBakeryMember(
            UUID bakeryId, UUID userId, String requiredRole) {
        try {
            BakeryChatClient.MembershipAuthorizationResponse response =
                    bakeryClient.authorizeMember(bakeryId, userId, requiredRole);
            if (response == null || !bakeryId.equals(response.bakeryId()) || !userId.equals(response.userId())) {
                throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Bakery membership authorization returned an invalid response");
            }
            if (response.authorized() && (response.memberRole() == null || response.memberRole().isBlank())) {
                throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Bakery membership authorization returned an invalid role");
            }
            return response;
        } catch (ChatException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 404) {
                throw new ChatException(HttpStatus.NOT_FOUND, "Bakery membership was not found");
            }
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Bakery membership authorization is unavailable");
        } catch (RestClientException exception) {
            throw new ChatException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Bakery membership authorization is unavailable");
        }
    }
}
