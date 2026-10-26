package com.se193262.chatservice.feature.conversation;

import com.se193262.chatservice.feature.conversation.dto.CloseConversationRequest;
import com.se193262.chatservice.feature.conversation.dto.ConversationResponse;
import com.se193262.chatservice.feature.conversation.dto.ConversationSummaryResponse;
import com.se193262.chatservice.feature.conversation.dto.CreateConversationRequest;
import com.se193262.chatservice.shared.dto.ApiResponse;
import com.se193262.chatservice.shared.dto.PageResult;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/v1/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @Operation(summary = "List conversations visible to the current participant")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<ConversationSummaryResponse>>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) ConversationStatus status,
            @RequestParam(required = false) UUID bakeryId,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        UUID userId = actorId(jwt);
        ConversationService.ConversationPage conversations =
                conversationService.list(userId, roles(jwt), status, bakeryId, page, size);
        return ResponseEntity.ok(ApiResponse.success(new PageResult<>(
                new PageResult.Meta(
                        conversations.meta().page(), conversations.meta().size(),
                        conversations.meta().pages(), conversations.meta().total()),
                conversations.results())));
    }

    @Operation(summary = "Create or retrieve a conversation for an authorized cake request")
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateConversationRequest request) {
        ConversationService.ConversationCreation creation = conversationService.create(
                request.cakeRequestId(), actorId(jwt), request.bakeryId());
        HttpStatus status = creation.existing() ? HttpStatus.OK : HttpStatus.CREATED;
        ConversationResponse response =
                conversationService.get(creation.conversation().getId(), actorId(jwt), roles(jwt));
        return ResponseEntity.status(status).body(creation.existing()
                ? ApiResponse.success(response)
                : ApiResponse.created(response));
    }

    @Operation(summary = "Get conversation details for an active participant")
    @GetMapping("/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> get(
            @PathVariable UUID conversationId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(
                conversationService.get(conversationId, actorId(jwt), roles(jwt))));
    }

    @Operation(summary = "Close a conversation")
    @PostMapping("/{conversationId}/close")
    public ResponseEntity<ApiResponse<ConversationResponse>> close(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody(required = false) CloseConversationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(conversationService.close(
                conversationId, actorId(jwt), roles(jwt), request == null ? null : request.reason())));
    }

    private UUID actorId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new com.se193262.chatservice.exception.ChatException(
                    HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new com.se193262.chatservice.exception.ChatException(
                    HttpStatus.UNAUTHORIZED, "The user identifier in the token is invalid");
        }
    }

    private Set<String> roles(Jwt jwt) {
        List<String> roleClaims = jwt.getClaimAsStringList("roles");
        return roleClaims == null ? Set.of() : Set.copyOf(roleClaims);
    }
}
