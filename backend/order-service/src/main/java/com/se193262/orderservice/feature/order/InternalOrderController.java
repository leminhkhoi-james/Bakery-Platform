package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.CreateOfferOrderRequest;
import com.se193262.orderservice.feature.order.dto.OrderContextResponse;
import com.se193262.orderservice.feature.order.dto.OrderReferenceResponse;
import com.se193262.orderservice.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/orders")
public class InternalOrderController {

    private final OrderCreationService orderCreationService;
    private final OrderManagementService orderManagementService;

    public InternalOrderController(
            OrderCreationService orderCreationService,
            OrderManagementService orderManagementService) {
        this.orderCreationService = orderCreationService;
        this.orderManagementService = orderManagementService;
    }

    @Operation(summary = "Create an order from an accepted Marketplace offer")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Order created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Existing order returned for an idempotent replay"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Idempotency or offer conflict"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "Required service unavailable")
    })
    @PostMapping("/from-offer")
    public ResponseEntity<ApiResponse<OrderReferenceResponse>> createFromOffer(
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @Valid @RequestBody CreateOfferOrderRequest request) {
        OrderCreationResult result = orderCreationService.createFromAcceptedOffer(idempotencyKey, request);
        OrderReferenceResponse reference = new OrderReferenceResponse(
                result.order().id(), result.order().orderNumber(), result.order().status());
        ApiResponse<OrderReferenceResponse> body = result.replayed()
                ? ApiResponse.success(reference)
                : ApiResponse.created(reference);
        return ResponseEntity.status(result.replayed() ? HttpStatus.OK : HttpStatus.CREATED).body(body);
    }

    @Operation(summary = "Get order context for internal consumers")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Order context"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Order not found")
    })
    @GetMapping("/{orderId}/context")
    public ResponseEntity<ApiResponse<OrderContextResponse>> getContext(@PathVariable UUID orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderManagementService.getContext(orderId)));
    }
}
