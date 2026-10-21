package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderContextResponse;
import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.feature.order.dto.OrderSummaryResponse;
import com.se193262.orderservice.shared.dto.PageResult;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public interface OrderManagementService {

    PageResult<OrderSummaryResponse> listOrders(
            UUID actorId, Set<String> roles, String scope, UUID bakeryId, OrderStatus status, OrderSource orderSource,
            Instant createdFrom, Instant createdTo, int page, int size, String sort);

        OrderResponse getOrder(UUID orderId, UUID actorId, Set<String> roles);

        OrderResponse transitionOrder(UUID orderId, OrderStatus targetStatus, String reason, UUID actorId, Set<String> roles);

    OrderContextResponse getContext(UUID orderId);
}