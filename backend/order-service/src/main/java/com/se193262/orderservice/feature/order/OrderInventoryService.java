package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.infrastructure.client.AddOnInventoryClient;
import com.se193262.orderservice.infrastructure.client.AddOnInventoryClient.Selection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.function.Function;

@Service
public class OrderInventoryService {
    private static final Logger log = LoggerFactory.getLogger(OrderInventoryService.class);
    private final OrderInventoryStore store;
    private final AddOnInventoryClient client;
    public OrderInventoryService(OrderInventoryStore store, AddOnInventoryClient client) {
        this.store = store; this.client = client;
    }

    public <T> T create(UUID bakeryId, List<Selection> selections, Function<UUID, T> saveOrder) {
        if (selections.isEmpty()) return saveOrder.apply(null);
        UUID orderId = UUID.randomUUID();
        store.begin(orderId, bakeryId);
        try {
            client.allocate(bakeryId, orderId, selections);
            T result = saveOrder.apply(orderId);
            // An idempotency race may return a different existing order; release this losing attempt.
            abandon(orderId);
            return result;
        } catch (RuntimeException error) {
            abandon(orderId);
            throw error;
        }
    }

    private void abandon(UUID orderId) {
        try { store.abandon(orderId); release(orderId); }
        catch (RuntimeException error) { log.warn("Inventory compensation queued for order {}", orderId); }
    }

    public void release(UUID orderId) {
        try {
            store.releaseBakery(orderId).ifPresent(bakeryId -> {
                client.release(bakeryId, orderId);
                store.released(orderId);
            });
        } catch (RuntimeException error) { log.warn("Inventory release will retry for order {}", orderId); }
    }

    @Scheduled(fixedDelayString = "${orders.inventory-recovery-delay-ms:30000}")
    public void recover() {
        for (var item : store.recoverable()) release((UUID) item.get("order_id"));
    }
}
