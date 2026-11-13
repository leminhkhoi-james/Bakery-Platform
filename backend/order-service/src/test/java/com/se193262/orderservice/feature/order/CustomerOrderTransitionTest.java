package com.se193262.orderservice.feature.order;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CustomerOrderTransitionTest {

    private static final UUID CUSTOMER_ID = UUID.randomUUID();
    private static final Instant CREATED_AT = Instant.parse("2026-10-20T00:00:00Z");

    @Test
    void allowsOnlyTheNextFulfillmentStatusAndRecordsAuditHistory() {
        CustomerOrder order = pendingOrder();
        order.addInitialStatusHistory(CUSTOMER_ID, CREATED_AT);

        order.transitionTo(OrderStatus.CONFIRMED, CUSTOMER_ID, "Accepted", CREATED_AT.plusSeconds(1));
        order.transitionTo(OrderStatus.BAKING, CUSTOMER_ID, "Started", CREATED_AT.plusSeconds(2));
        order.transitionTo(OrderStatus.READY, CUSTOMER_ID, "Finished", CREATED_AT.plusSeconds(3));
        order.transitionTo(OrderStatus.DELIVERING, CUSTOMER_ID, "Courier assigned", CREATED_AT.plusSeconds(4));
        order.transitionTo(OrderStatus.COMPLETED, CUSTOMER_ID, "Delivered", CREATED_AT.plusSeconds(5));

        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        assertEquals(CREATED_AT.plusSeconds(1), order.getAcceptedAt());
        assertEquals(CREATED_AT.plusSeconds(5), order.getCompletedAt());
        assertEquals(6, order.getStatusHistory().size());
        assertEquals(OrderStatus.DELIVERING, order.getStatusHistory().getLast().getFromStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatusHistory().getLast().getToStatus());
    }

    @Test
    void rejectsSkippedTransitionsAndCancellationAfterBaking() {
        CustomerOrder order = pendingOrder();

        assertThrows(OrderConflictException.class,
                () -> order.transitionTo(OrderStatus.BAKING, CUSTOMER_ID, null, CREATED_AT.plusSeconds(1)));

        order.transitionTo(OrderStatus.CONFIRMED, CUSTOMER_ID, null, CREATED_AT.plusSeconds(1));
        order.transitionTo(OrderStatus.BAKING, CUSTOMER_ID, null, CREATED_AT.plusSeconds(2));
        assertThrows(OrderConflictException.class,
                () -> order.transitionTo(OrderStatus.CANCELLED, CUSTOMER_ID, null, CREATED_AT.plusSeconds(3)));
    }

    @Test
    void permitsCancellationOnlyBeforeBaking() {
        CustomerOrder order = pendingOrder();
        order.transitionTo(OrderStatus.CANCELLED, CUSTOMER_ID, "Customer cancelled", CREATED_AT.plusSeconds(1));

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertNull(order.getAcceptedAt());
    }

    private CustomerOrder pendingOrder() {
        return CustomerOrder.create(CUSTOMER_ID, UUID.randomUUID(), null, null, OrderSource.DIRECT_CATALOG,
                "Customer", "+84900000000", "Bakery", null, new BigDecimal("100.00"), BigDecimal.ZERO,
                new BigDecimal("100.00"), CREATED_AT.plusSeconds(3600), CREATED_AT);
    }
}