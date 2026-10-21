package com.se193262.orderservice.feature.order.dto;

import com.se193262.orderservice.feature.order.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TransitionOrderRequest(
        @NotNull OrderStatus targetStatus,
        @Size(max = 1000) String reason
) {
}
