package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.CreateDirectOrderRequest;
import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.feature.order.dto.OrderSummaryResponse;
import com.se193262.orderservice.feature.order.dto.TransitionOrderRequest;
import com.se193262.orderservice.shared.dto.ApiResponse;
import com.se193262.orderservice.shared.dto.PageResult;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderCreationService orderCreationService;
    private final OrderManagementService orderManagementService;

    public OrderController(OrderCreationService orderCreationService, OrderManagementService orderManagementService) {
        this.orderCreationService = orderCreationService;
        this.orderManagementService = orderManagementService;
    }

    @Operation(summary = "Create a direct catalog order")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Order created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Idempotency conflict"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Order request is invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "Required service unavailable")
    })
    @PostMapping("/direct")
    public ResponseEntity<ApiResponse<OrderResponse>> createDirectOrder(
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateDirectOrderRequest request) {
        OrderCreationResult result = orderCreationService.createDirectOrder(
                requiredActorId(jwt), idempotencyKey, request);
        ApiResponse<OrderResponse> body = result.replayed()
                ? ApiResponse.success(result.order())
                : ApiResponse.created(result.order());
        return ResponseEntity.status(result.replayed() ? HttpStatus.OK : HttpStatus.CREATED).body(body);
    }

    @Operation(summary = "List orders visible to the current caller")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Paginated order summaries"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid filters or pagination")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<OrderSummaryResponse>>> getOrders(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) UUID bakeryId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) OrderSource orderSource,
            @RequestParam(required = false) Instant createdFrom,
            @RequestParam(required = false) Instant createdTo,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        PageResult<OrderSummaryResponse> result = orderManagementService.listOrders(
            actorId(jwt), roles(jwt), scope, bakeryId, status, orderSource, createdFrom, createdTo, page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Get an order with immutable snapshots and history")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Order details"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Order not found")
    })
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(
                orderManagementService.getOrder(orderId, requiredActorId(jwt), roles(jwt))));
    }

    @Operation(summary = "Transition an order to another fulfillment status")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Order status updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Invalid state transition or concurrent update")
    })
    @PostMapping("/{orderId}/status-transitions")
    public ResponseEntity<ApiResponse<OrderResponse>> transitionOrder(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TransitionOrderRequest request) {
        OrderResponse result = orderManagementService.transitionOrder(
            orderId, request.targetStatus(), request.reason(), requiredActorId(jwt), roles(jwt));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private UUID actorId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            return null;
        }
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new OrderAuthenticationRequiredException();
        }
    }

    private UUID requiredActorId(Jwt jwt) {
        UUID actorId = actorId(jwt);
        if (actorId == null) {
            throw new OrderAuthenticationRequiredException();
        }
        return actorId;
    }

    private Set<String> roles(Jwt jwt) {
        if (jwt == null) {
            return Set.of();
        }
        List<String> roleClaims = jwt.getClaimAsStringList("roles");
        return roleClaims == null ? Set.of() : Set.copyOf(roleClaims);
    }
}
