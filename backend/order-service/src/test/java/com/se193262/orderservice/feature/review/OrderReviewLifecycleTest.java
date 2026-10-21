package com.se193262.orderservice.feature.review;

import com.se193262.orderservice.feature.order.CustomerOrder;
import com.se193262.orderservice.feature.order.OrderConflictException;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderReviewLifecycleTest {

    private static final Instant CREATED_AT = Instant.parse("2026-10-20T00:00:00Z");

    @Test
    void allowsPublishedReviewEditAndHideRestore() {
        CustomerOrder order = order();
        UUID customerId = order.getCustomerId();
        OrderReview review = OrderReview.create(order, customerId, (short) 5, "Great", CREATED_AT);

        review.update((short) 4, "Updated", CREATED_AT.plusSeconds(1));
        review.moderate(ReviewStatus.HIDDEN, CREATED_AT.plusSeconds(2));
        review.moderate(ReviewStatus.PUBLISHED, CREATED_AT.plusSeconds(3));

        assertEquals((short) 4, review.getRating());
        assertEquals("Updated", review.getComment());
        assertEquals(ReviewStatus.PUBLISHED, review.getStatus());
        assertEquals(CREATED_AT.plusSeconds(3), review.getUpdatedAt());
    }

    @Test
    void deletedReviewCannotBeEditedOrRestored() {
        OrderReview review = OrderReview.create(order(), UUID.randomUUID(), (short) 3, null, CREATED_AT);
        review.softDelete(CREATED_AT.plusSeconds(1));

        assertEquals(ReviewStatus.DELETED, review.getStatus());
        assertThrows(OrderConflictException.class,
                () -> review.update((short) 4, "No", CREATED_AT.plusSeconds(2)));
        assertThrows(OrderConflictException.class,
                () -> review.moderate(ReviewStatus.PUBLISHED, CREATED_AT.plusSeconds(2)));
    }

    @Test
    void cannotDeleteReviewTwiceOrTransitionToDeletedThroughModeration() {
        OrderReview review = OrderReview.create(order(), UUID.randomUUID(), (short) 3, null, CREATED_AT);
        review.softDelete(CREATED_AT.plusSeconds(1));

        assertThrows(OrderConflictException.class, () -> review.softDelete(CREATED_AT.plusSeconds(2)));
        assertThrows(OrderConflictException.class,
                () -> review.moderate(ReviewStatus.DELETED, CREATED_AT.plusSeconds(2)));
    }

    private CustomerOrder order() {
        return Mockito.mock(CustomerOrder.class);
    }
}