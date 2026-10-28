package com.se193262.chatservice;

import com.se193262.chatservice.infrastructure.client.BakeryChatClient;
import com.se193262.chatservice.infrastructure.client.MarketplaceChatClient;
import com.se193262.chatservice.infrastructure.storage.AttachmentStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class ChatServiceApplicationTests {

    private static final UUID CUSTOMER_ID = UUID.fromString("4ccca4ab-50a8-4d37-9a25-d95450f7b77f");
    private static final UUID BAKERY_USER_ID = UUID.fromString("58cd4975-e979-4d87-95d4-cceb7dbb4fd7");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MarketplaceChatClient marketplaceClient;

    @MockitoBean
    private BakeryChatClient bakeryClient;

    @MockitoBean
    private AttachmentStorage attachmentStorage;

    @BeforeEach
    void configureServiceAuthorization() {
        when(marketplaceClient.authorizeChat(
                org.mockito.ArgumentMatchers.any(), eq(CUSTOMER_ID), org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> {
                    UUID requestId = invocation.getArgument(0);
                    UUID bakeryId = invocation.getArgument(2);
                    return new MarketplaceChatClient.ChatAuthorizationResponse(
                            requestId, CUSTOMER_ID, bakeryId, "OPEN", true);
                });
    }

    @Test
    @DisplayName("Chat Service starts, migrates PostgreSQL schema, and validates entities")
    void contextLoads() {
    }

    @Test
    @DisplayName("OpenAPI is public and advertises bearer authentication")
    void openApiIsPublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("bearerAuth")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/api/v1/conversations")));
    }

    @Test
    @DisplayName("Conversation membership, idempotent messages, unread receipts, and closing work")
    void conversationAndMessagingLifecycleWorks() throws Exception {
        UUID requestId = UUID.randomUUID();
        UUID bakeryId = UUID.randomUUID();
        String conversationId = createConversation(requestId, bakeryId);

        when(bakeryClient.authorizeMember(
                eq(bakeryId), eq(BAKERY_USER_ID), org.mockito.ArgumentMatchers.isNull()))
                .thenReturn(new BakeryChatClient.MembershipAuthorizationResponse(
                        bakeryId, BAKERY_USER_ID, true, "OWNER", true));

        mockMvc.perform(get("/api/v1/conversations/{conversationId}", conversationId)
                        .with(jwtToken(BAKERY_USER_ID, "ROLE_BAKERY_OWNER")))
                .andExpect(status().isOk());

        UUID clientMessageId = UUID.randomUUID();
        MockMultipartFile metadata = metadata(clientMessageId, "First message");
        String created = mockMvc.perform(multipart("/api/v1/conversations/{conversationId}/messages",
                                conversationId)
                        .file(metadata)
                        .with(jwtToken(CUSTOMER_ID, "ROLE_CUSTOMER")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value("First message"))
                .andReturn().getResponse().getContentAsString();
        UUID sentMessageId = UUID.fromString(com.jayway.jsonpath.JsonPath.read(created, "$.data.id"));

        mockMvc.perform(multipart("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .file(metadata(clientMessageId, "First message"))
                        .with(jwtToken(CUSTOMER_ID, "ROLE_CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(sentMessageId.toString()));

        mockMvc.perform(multipart("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .file(metadata(clientMessageId, "Different payload"))
                        .with(jwtToken(CUSTOMER_ID, "ROLE_CUSTOMER")))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .with(jwtToken(BAKERY_USER_ID, "ROLE_BAKERY_OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(sentMessageId.toString()));

        mockMvc.perform(post("/api/v1/conversations/{conversationId}/read", conversationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"throughMessageId\":\"" + sentMessageId + "\"}")
                        .with(jwtToken(BAKERY_USER_ID, "ROLE_BAKERY_OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversationId").value(conversationId));

        mockMvc.perform(get("/api/v1/conversations")
                        .param("bakeryId", bakeryId.toString())
                        .with(jwtToken(BAKERY_USER_ID, "ROLE_BAKERY_OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.result[0].unreadCount").value(0));

        mockMvc.perform(post("/api/v1/conversations/{conversationId}/close", conversationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Discussion completed\"}")
                        .with(jwtToken(CUSTOMER_ID, "ROLE_CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));

        mockMvc.perform(multipart("/api/v1/conversations/{conversationId}/messages", conversationId)
                        .file(metadata(UUID.randomUUID(), "After close"))
                        .with(jwtToken(CUSTOMER_ID, "ROLE_CUSTOMER")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Protected routes reject anonymous and service-token callers")
    void protectedRoutesRejectInvalidCallers() throws Exception {
        mockMvc.perform(get("/api/v1/conversations"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/conversations")
                        .with(jwtToken(UUID.randomUUID(), "SCOPE_chat:conversation:read")
                                .jwt(jwt -> jwt.claim("token_type", "service"))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/internal/v1/conversations")
                        .with(jwtToken(UUID.randomUUID(), "SCOPE_chat:conversation:read")
                                .jwt(jwt -> jwt.claim("token_type", "service"))))
                .andExpect(status().isForbidden());
    }

    private String createConversation(UUID requestId, UUID bakeryId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cakeRequestId\":\"" + requestId + "\",\"bakeryId\":\"" + bakeryId + "\"}")
                        .with(jwtToken(CUSTOMER_ID, "ROLE_CUSTOMER")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(response, "$.data.id");
    }

    private MockMultipartFile metadata(UUID clientMessageId, String content) {
        String json = "{\"clientMessageId\":\"" + clientMessageId
                + "\",\"messageType\":\"TEXT\",\"content\":\"" + content + "\"}";
        return new MockMultipartFile(
                "metadata", "metadata.json", MediaType.APPLICATION_JSON_VALUE,
                json.getBytes(StandardCharsets.UTF_8));
    }

    private JwtRequestPostProcessor jwtToken(UUID userId, String authority) {
        return jwt()
                .jwt(jwt -> jwt.subject(userId.toString())
                        .claim("token_type", "user")
                        .claim("roles", authority.startsWith("ROLE_")
                                ? List.of(authority.substring("ROLE_".length()))
                                : List.of()))
                .authorities(new SimpleGrantedAuthority(authority));
    }
}
