package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderContextResponse;
import com.se193262.orderservice.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/v1/orders")
public class InternalOrderController {

    private final OrderManagementService orderManagementService;

    public InternalOrderController(OrderManagementService orderManagementService) {
        this.orderManagementService = orderManagementService;
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
