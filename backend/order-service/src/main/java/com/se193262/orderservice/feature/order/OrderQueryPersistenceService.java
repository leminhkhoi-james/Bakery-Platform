package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderContextResponse;
import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.feature.order.dto.OrderSummaryResponse;
import com.se193262.orderservice.shared.dto.PageResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OrderQueryPersistenceService {

    private final CustomerOrderRepository orderRepository;

    public OrderQueryPersistenceService(CustomerOrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public PageResult<OrderSummaryResponse> list(
            Specification<CustomerOrder> specification, int page, int size, Sort sort) {
        Page<CustomerOrder> orders = orderRepository.findAll(specification,
                PageRequest.of(page - 1, size, sort));
        return new PageResult<>(
                new PageResult.Meta(page, size, orders.getTotalPages(), orders.getTotalElements()),
                orders.getContent().stream().map(this::toSummary).toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId) {
        return OrderResponseMapper.toResponse(findOrder(orderId));
    }

    @Transactional(readOnly = true)
    public OrderAuthorizationContext getAuthorizationContext(UUID orderId) {
        CustomerOrder order = findOrder(orderId);
        return new OrderAuthorizationContext(order.getCustomerId(), order.getBakeryId());
    }

    @Transactional
    public OrderResponse transition(UUID orderId, OrderStatus targetStatus, String reason, UUID actorId) {
        CustomerOrder order = findOrder(orderId);
        order.transitionTo(targetStatus, actorId, reason, java.time.Instant.now());
        return OrderResponseMapper.toResponse(orderRepository.saveAndFlush(order));
    }

    @Transactional(readOnly = true)
    public OrderContextResponse getContext(UUID orderId) {
        CustomerOrder order = findOrder(orderId);
        return new OrderContextResponse(
                order.getId(), order.getCustomerId(), order.getBakeryId(), order.getCakeRequestId(),
                order.getOfferId(), order.getStatus(),
                order.getStatus() == OrderStatus.COMPLETED && order.getReview() == null);
    }

    private CustomerOrder findOrder(UUID orderId) {
        return orderRepository.findById(orderId).orElseThrow(OrderNotFoundException::new);
    }

    private OrderSummaryResponse toSummary(CustomerOrder order) {
        return new OrderSummaryResponse(
                order.getId(), order.getOrderNumber(), order.getCustomerId(), order.getBakeryId(),
                order.getBakeryNameSnapshot(), order.getOrderSource(), order.getStatus(),
                order.getTotalAmount(), order.getCurrency(), order.getNeededAt(), order.getCreatedAt());
    }
}