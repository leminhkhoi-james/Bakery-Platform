package com.se193262.orderservice.infrastructure.scheduler;

import com.se193262.orderservice.feature.order.CustomerOrder;
import com.se193262.orderservice.feature.order.CustomerOrderRepository;
import com.se193262.orderservice.feature.order.OrderQueryPersistenceService;
import com.se193262.orderservice.feature.order.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderAutoCompletionSchedulerTest {

    @Mock
    private CustomerOrderRepository orderRepository;
    @Mock
    private OrderQueryPersistenceService persistenceService;

    private Clock clock;
    private OrderAutoCompletionScheduler scheduler;
    private final Instant now = Instant.parse("2026-11-09T18:00:00Z");

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(now, ZoneOffset.UTC);
        scheduler = new OrderAutoCompletionScheduler(orderRepository, persistenceService, clock, 24);
    }

    @Test
    void completesDeliveringOrdersOlderThan24Hours() {
        CustomerOrder order = mock(CustomerOrder.class);
        UUID orderId = UUID.randomUUID();
        when(order.getId()).thenReturn(orderId);
        when(order.getOrderNumber()).thenReturn("ORD-TEST-001");

        Instant cutoff = now.minus(java.time.Duration.ofHours(24));
        when(orderRepository.findAllByStatusAndUpdatedAtBefore(OrderStatus.DELIVERING, cutoff))
                .thenReturn(List.of(order));

        scheduler.autoCompleteDeliveredOrders();

        verify(persistenceService).transition(
                eq(orderId),
                eq(OrderStatus.COMPLETED),
                eq("Hệ thống tự động hoàn tất sau 24 giờ kể từ khi giao hàng"),
                any(UUID.class));
    }
}

