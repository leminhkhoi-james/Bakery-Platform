package com.se193262.orderservice.feature.order;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Repository
public class OrderInventoryStore {
    private final JdbcClient jdbc;
    public OrderInventoryStore(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Transactional
    public void begin(UUID orderId, UUID bakeryId) {
        jdbc.sql("insert into order_inventory_intents(order_id,bakery_id,state) values (:id,:bakery,'RESERVING')")
                .param("id", orderId).param("bakery", bakeryId).update();
    }

    // Joins the same transaction that saves the order. A recovery claim fences late commits.
    @Transactional
    public void commit(UUID orderId) {
        var rows = jdbc.sql("select state from order_inventory_intents where order_id=:id for update")
                .param("id", orderId).query(String.class).list();
        if (rows.isEmpty()) return; // Orders without catalog accessories do not need an allocation.
        if (!"RESERVING".equals(rows.getFirst())) throw new OrderConflictException("Inventory reservation expired; retry the order");
        jdbc.sql("update order_inventory_intents set state='COMMITTED',updated_at=now() where order_id=:id")
                .param("id", orderId).update();
    }

    @Transactional
    public void abandon(UUID orderId) {
        jdbc.sql("update order_inventory_intents set state='RELEASE_REQUIRED',updated_at=now() where order_id=:id and state='RESERVING'")
                .param("id", orderId).update();
    }

    @Transactional
    public void cancel(UUID orderId) {
        jdbc.sql("update order_inventory_intents set state='RELEASE_REQUIRED',updated_at=now() where order_id=:id and state='COMMITTED'")
                .param("id", orderId).update();
    }

    @Transactional
    public List<Map<String, Object>> recoverable() {
        jdbc.sql("update order_inventory_intents set state='RELEASE_REQUIRED',updated_at=now() where state='RESERVING' and created_at < now()-interval '2 minutes'").update();
        return jdbc.sql("select order_id,bakery_id from order_inventory_intents where state='RELEASE_REQUIRED' order by updated_at limit 25")
                .query().listOfRows();
    }

    public Optional<UUID> releaseBakery(UUID orderId) {
        return jdbc.sql("select bakery_id from order_inventory_intents where order_id=:id and state='RELEASE_REQUIRED'")
                .param("id", orderId).query(UUID.class).optional();
    }

    @Transactional
    public void released(UUID orderId) {
        jdbc.sql("update order_inventory_intents set state='RELEASED',updated_at=now() where order_id=:id and state='RELEASE_REQUIRED'")
                .param("id", orderId).update();
    }
}
