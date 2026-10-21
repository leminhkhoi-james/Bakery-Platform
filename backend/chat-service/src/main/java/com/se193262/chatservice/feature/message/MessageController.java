package com.se193262.chatservice.feature.message;

import com.se193262.chatservice.feature.message.dto.MessageMetadata;
import com.se193262.chatservice.feature.message.dto.MessagePageResponse;
import com.se193262.chatservice.feature.message.dto.MessageResponse;
import com.se193262.chatservice.feature.message.dto.ReadMessagesRequest;
import com.se193262.chatservice.feature.message.dto.ReadMessagesResponse;
import com.se193262.chatservice.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/v1/conversations/{conversationId}")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @Operation(summary = "List messages using a newest-first cursor page")
    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<MessagePageResponse>> list(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String before,
            @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(ApiResponse.success(messageService.list(
                conversationId, actorId(jwt), roles(jwt), before, limit)));
    }

    @Operation(summary = "Send an idempotent text, image, or file message")
    @PostMapping(value = "/messages", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<MessageResponse>> send(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestPart("metadata") MessageMetadata metadata,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        MessageService.MessageCreation creation = messageService.send(
                conversationId, actorId(jwt), roles(jwt), metadata, files);
        HttpStatus status = creation.replayed() ? HttpStatus.OK : HttpStatus.CREATED;
        MessageResponse response = messageService.response(creation.message());
        return ResponseEntity.status(status).body(creation.replayed()
                ? ApiResponse.success(response)
                : ApiResponse.created(response));
    }

    @Operation(summary = "Mark messages as read through the given message")
    @PostMapping("/read")
    public ResponseEntity<ApiResponse<ReadMessagesResponse>> markRead(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @org.springframework.web.bind.annotation.RequestBody ReadMessagesRequest request) {
        return ResponseEntity.ok(ApiResponse.success(messageService.markRead(
                conversationId, actorId(jwt), roles(jwt), request.throughMessageId())));
    }

    @Operation(summary = "Delete the current user's message while preserving a tombstone")
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @AuthenticationPrincipal Jwt jwt) {
        messageService.delete(conversationId, messageId, actorId(jwt), roles(jwt));
        return ResponseEntity.noContent().build();
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
