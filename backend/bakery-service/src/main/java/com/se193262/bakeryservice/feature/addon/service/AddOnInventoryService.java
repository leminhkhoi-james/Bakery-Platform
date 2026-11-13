package com.se193262.bakeryservice.feature.addon.service;

import com.se193262.platform.exception.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AddOnInventoryService {
    private final JdbcClient jdbc;

    public AddOnInventoryService(JdbcClient jdbc) { this.jdbc = jdbc; }

    public record Selection(@NotNull UUID addOnId, @Min(1) @Max(100) int quantity) {}
    public record AllocationRequest(@NotNull @Size(min = 1, max = 100) List<@NotNull @Valid Selection> addOns) {}

    @Transactional
    public void allocate(UUID bakeryId, UUID orderId, AllocationRequest request) {
        var selections = request.addOns().stream().sorted(Comparator.comparing(Selection::addOnId)).toList();
        if (selections.stream().map(Selection::addOnId).distinct().count() != selections.size())
            throw BusinessException.invalid("Duplicate add-on");
        String fingerprint = selections.toString();
        var existing = lockAllocation(bakeryId, orderId);
        if (!existing.isEmpty()) {
            if (!"ALLOCATED".equals(existing.get("state")) || !fingerprint.equals(existing.get("fingerprint")))
                throw new BusinessException(409, "Inventory allocation was released or has different items");
            return;
        }
        // Stable row order prevents competing multi-accessory orders from deadlocking.
        for (var selection : selections) {
            var item = lockAddOn(bakeryId, selection.addOnId());
            if (!Boolean.TRUE.equals(item.get("active")))
                throw new BusinessException(409, "Phụ kiện " + item.get("name") + " đã ngừng bán.");
            requireStock((String) item.get("name"), (Integer) item.get("stock_quantity"), selection.quantity());
            changeStock(selection.addOnId(), -selection.quantity());
        }
        jdbc.sql("insert into add_on_allocations(order_id,bakery_id,state,fingerprint) values (:id,:bakery,'ALLOCATED',:hash)")
                .param("id", orderId).param("bakery", bakeryId).param("hash", fingerprint).update();
        for (var selection : selections)
            jdbc.sql("insert into add_on_allocation_items(order_id,add_on_id,quantity) values (:id,:addon,:quantity)")
                    .param("id", orderId).param("addon", selection.addOnId()).param("quantity", selection.quantity()).update();
    }

    @Transactional
    public void release(UUID bakeryId, UUID orderId) {
        var existing = lockAllocation(bakeryId, orderId);
        if (existing.isEmpty()) {
            // Tombstone fences a delayed allocation after an ambiguous HTTP timeout.
            jdbc.sql("insert into add_on_allocations(order_id,bakery_id,state) values (:id,:bakery,'RELEASED')")
                    .param("id", orderId).param("bakery", bakeryId).update();
            return;
        }
        if ("RELEASED".equals(existing.get("state"))) return;
        var items = jdbc.sql("select add_on_id,quantity from add_on_allocation_items where order_id=:id order by add_on_id")
                .param("id", orderId).query().listOfRows();
        for (var item : items) {
            UUID addOnId = (UUID) item.get("add_on_id");
            lockAddOn(bakeryId, addOnId);
            changeStock(addOnId, (Integer) item.get("quantity"));
        }
        jdbc.sql("update add_on_allocations set state='RELEASED',updated_at=now() where order_id=:id")
                .param("id", orderId).update();
    }

    private Map<String, Object> lockAllocation(UUID bakeryId, UUID orderId) {
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended(cast(:id as text), 4104))")
                .param("id", orderId).query().listOfRows();
        var rows = jdbc.sql("select bakery_id,state,fingerprint from add_on_allocations where order_id=:id")
                .param("id", orderId).query().listOfRows();
        if (rows.isEmpty()) return Map.of();
        if (!bakeryId.equals(rows.getFirst().get("bakery_id"))) throw BusinessException.conflict();
        return rows.getFirst();
    }

    private Map<String, Object> lockAddOn(UUID bakeryId, UUID addOnId) {
        return jdbc.sql("select name,active,stock_quantity from add_ons where id=:id and bakery_id=:bakery for update")
                .param("id", addOnId).param("bakery", bakeryId).query().listOfRows().stream().findFirst()
                .orElseThrow(BusinessException::missing);
    }

    private void changeStock(UUID addOnId, int delta) {
        jdbc.sql("update add_ons set stock_quantity=stock_quantity+:delta,version=version+1,updated_at=now() where id=:id")
                .param("id", addOnId).param("delta", delta).update();
    }

    public static void requireStock(String name, Integer available, int quantity) {
        if (available == null) throw new BusinessException(409, "Phụ kiện " + name + " chưa được tiệm nhập tồn kho.");
        if (quantity > available) throw new BusinessException(409, "Phụ kiện " + name + " chỉ còn " + available + " sản phẩm.");
    }
}
