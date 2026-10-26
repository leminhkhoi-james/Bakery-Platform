package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.*;
import com.se193262.platform.exception.BusinessException;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;

@Repository
public class OfferOrderRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper json;

    public OfferOrderRepository(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public Optional<OrderCreationResponse> existing(String key, String fingerprint, UUID offerId) {
        var rows =
                jdbc.sql(
                                "select"
                                    + " c.idempotency_key,c.payload_fingerprint,o.id,o.order_number,o.status"
                                    + " from order_offer_creations c join customer_orders o on"
                                    + " o.offer_id=c.offer_id where c.idempotency_key=:key or"
                                    + " c.offer_id=:offerId")
                        .param("key", key)
                        .param("offerId", offerId)
                        .query()
                        .listOfRows();
        if (rows.isEmpty()) return Optional.empty();
        var row = rows.getFirst();
        if (rows.size() != 1
                || !key.equals(row.get("idempotency_key"))
                || !fingerprint.equals(row.get("payload_fingerprint")))
            throw BusinessException.conflict();
        return Optional.of(
                new OrderCreationResponse(
                        (UUID) row.get("id"),
                        (String) row.get("order_number"),
                        (String) row.get("status")));
    }

    @Transactional
    public OfferOrderService.Creation save(
            String key,
            String fingerprint,
            CreateOfferOrderRequest command,
            OfferOrderSource source,
            Map<String, Object> user,
            Map<String, Object> bakery,
            Map<String, Object> address) {
        var existing = existing(key, fingerprint, command.offerId());
        if (existing.isPresent()) return new OfferOrderService.Creation(existing.get(), false);
        UUID orderId = UUID.randomUUID();
        String number =
                "ORD-"
                        + LocalDate.now(java.time.ZoneOffset.UTC).toString().replace("-", "")
                        + "-"
                        + orderId.toString().replace("-", "").substring(0, 20);
        Map<String, Object> order = new HashMap<>();
        order.put("id", orderId);
        order.put("order_number", number);
        order.put("customer_id", command.customerId());
        order.put("bakery_id", source.bakeryId());
        order.put("cake_request_id", command.cakeRequestId());
        order.put("offer_id", command.offerId());
        order.put("order_source", "ACCEPTED_OFFER");
        order.put("customer_name_snapshot", user.get("displayName"));
        order.put("customer_phone_snapshot", user.get("phoneNumber"));
        order.put("bakery_name_snapshot", bakery.get("name"));
        order.put("subtotal", source.cakePrice().add(source.addOnTotal()));
        order.put("delivery_fee", source.deliveryFee());
        order.put("total_amount", source.totalPrice());
        order.put("needed_at", Timestamp.from(source.neededAt()));
        insert("customer_orders", order);
        item(
                orderId,
                null,
                "CAKE",
                source.title(),
                source.description(),
                1,
                source.cakePrice(),
                source.cakePrice(),
                source.configuration());
        for (var item : source.items())
            item(
                    orderId,
                    item.id(),
                    "ADD_ON",
                    item.itemNameSnapshot(),
                    item.descriptionSnapshot(),
                    item.quantity(),
                    item.unitPrice(),
                    item.lineTotal(),
                    Map.of());
        Map<String, Object> delivery = new HashMap<>();
        delivery.put("order_id", orderId);
        for (String field :
                List.of(
                        "recipientName",
                        "recipientPhone",
                        "addressLine",
                        "ward",
                        "district",
                        "city",
                        "latitude",
                        "longitude"))
            delivery.put(
                    field.replaceAll("([A-Z])", "_$1").toLowerCase(Locale.ROOT),
                    address.get(field));
        delivery.put("delivery_note", command.deliveryNote());
        insert("delivery_address_snapshots", delivery);
        insert(
                "order_status_history",
                Map.of(
                        "id",
                        UUID.randomUUID(),
                        "order_id",
                        orderId,
                        "to_status",
                        "PENDING",
                        "changed_by",
                        command.customerId()));
        insert(
                "order_offer_creations",
                Map.of(
                        "idempotency_key",
                        key,
                        "offer_id",
                        command.offerId(),
                        "payload_fingerprint",
                        fingerprint));
        return new OfferOrderService.Creation(
                new OrderCreationResponse(orderId, number, "PENDING"), true);
    }

    private void item(
            UUID orderId,
            UUID sourceId,
            String type,
            String name,
            String description,
            int quantity,
            BigDecimal price,
            BigDecimal total,
            Map<String, Object> configuration) {
        String snapshot;
        try {
            snapshot = json.writeValueAsString(configuration);
        } catch (Exception error) {
            throw BusinessException.invalid("Invalid configuration snapshot");
        }
        Map<String, Object> values = new HashMap<>();
        values.put("id", UUID.randomUUID());
        values.put("order_id", orderId);
        values.put("source_offer_item_id", sourceId);
        values.put("item_type", type);
        values.put("name_snapshot", name);
        values.put("description_snapshot", description);
        values.put("quantity", quantity);
        values.put("unit_price", price);
        values.put("line_total", total);
        List<String> fields = new ArrayList<>(values.keySet());
        String sql =
                "insert into order_items ("
                        + String.join(",", fields)
                        + ",configuration_snapshot) values ("
                        + fields.stream()
                                .map(f -> ":" + f)
                                .collect(java.util.stream.Collectors.joining(","))
                        + ",cast(:snapshot as jsonb))";
        jdbc.sql(sql).params(values).param("snapshot", snapshot).update();
    }

    private void insert(String table, Map<String, Object> values) {
        // Table and column identifiers come exclusively from the fixed calls above.
        List<String> fields = new ArrayList<>(values.keySet());
        String sql =
                "insert into "
                        + table
                        + " ("
                        + String.join(",", fields)
                        + ") values ("
                        + fields.stream()
                                .map(f -> ":" + f)
                                .collect(java.util.stream.Collectors.joining(","))
                        + ")";
        jdbc.sql(sql).params(values).update();
    }
}
