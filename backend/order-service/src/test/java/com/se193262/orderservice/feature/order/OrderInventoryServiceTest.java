package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.infrastructure.client.AddOnInventoryClient;
import com.se193262.orderservice.infrastructure.client.AddOnInventoryClient.Selection;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class OrderInventoryServiceTest {
    @Test
    @DisplayName("No accessories requires neither a network call nor an inventory intent")
    void create_withoutAccessories_savesDirectly() {
        var store = mock(OrderInventoryStore.class); var client = mock(AddOnInventoryClient.class);
        var service = new OrderInventoryService(store, client);
        assertEquals("saved", service.create(UUID.randomUUID(), List.of(), id -> { assertNull(id); return "saved"; }));
        verifyNoInteractions(store, client);
    }

    @Test
    @DisplayName("An allocation is durable before HTTP; persistence failure releases exactly that attempt")
    void create_failedPersistence_releasesCandidate() {
        var store = mock(OrderInventoryStore.class); var client = mock(AddOnInventoryClient.class);
        UUID bakery = UUID.randomUUID(); var selections = List.of(new Selection(UUID.randomUUID(), 3));
        when(store.releaseBakery(any())).thenReturn(Optional.of(bakery));
        var service = new OrderInventoryService(store, client);
        var expected = new IllegalStateException("DB rejected");
        assertSame(expected, assertThrows(IllegalStateException.class,
                () -> service.create(bakery, selections, id -> { throw expected; })));
        var sequence = inOrder(store, client);
        var candidate = org.mockito.ArgumentCaptor.forClass(UUID.class);
        sequence.verify(store).begin(candidate.capture(), eq(bakery));
        sequence.verify(client).allocate(bakery, candidate.getValue(), selections);
        sequence.verify(store).abandon(candidate.getValue());
        sequence.verify(store).releaseBakery(candidate.getValue());
        sequence.verify(client).release(bakery, candidate.getValue());
        sequence.verify(store).released(candidate.getValue());
    }

    @Test
    @DisplayName("Release outage leaves the intent pending and a later worker run retries it")
    void release_remoteFailure_retriesWithoutMarkingReleased() {
        var store = mock(OrderInventoryStore.class); var client = mock(AddOnInventoryClient.class);
        UUID bakery = UUID.randomUUID(), order = UUID.randomUUID();
        when(store.releaseBakery(order)).thenReturn(Optional.of(bakery));
        doThrow(new IllegalStateException("offline")).doNothing().when(client).release(bakery, order);
        var service = new OrderInventoryService(store, client);
        assertDoesNotThrow(() -> service.release(order));
        verify(store, never()).released(order);
        when(store.recoverable()).thenReturn(List.of(Map.of("order_id", order, "bakery_id", bakery)));
        service.recover();
        verify(client, times(2)).release(bakery, order);
        verify(store).released(order);
    }

    @Test
    @DisplayName("Committed orders are not compensated even when the caller observes a late failure")
    void create_ambiguousCommit_doesNotReleaseCommittedIntent() {
        var store = mock(OrderInventoryStore.class); var client = mock(AddOnInventoryClient.class);
        when(store.releaseBakery(any())).thenReturn(Optional.empty());
        var service = new OrderInventoryService(store, client);
        assertThrows(IllegalStateException.class, () -> service.create(UUID.randomUUID(),
                List.of(new Selection(UUID.randomUUID(), 1)), id -> { throw new IllegalStateException("commit acknowledgement lost"); }));
        verify(client, never()).release(any(), any());
    }
}
