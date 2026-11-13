package com.se193262.orderservice.feature.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_idempotency_records", uniqueConstraints = @UniqueConstraint(
        name = "uq_order_idempotency_records_operation_customer_key",
        columnNames = {"operation", "customer_id", "idempotency_key"}))
public class OrderIdempotencyRecord {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "operation", nullable = false, length = 40)
    private String operation;

    @Column(name = "idempotency_key", nullable = false)
    private UUID idempotencyKey;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_idempotency_records_order"))
    private CustomerOrder customerOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected OrderIdempotencyRecord() {
    }

    static OrderIdempotencyRecord create(
            String operation,
            UUID customerId,
            UUID idempotencyKey,
            String payloadHash,
            CustomerOrder customerOrder,
            Instant createdAt) {
        OrderIdempotencyRecord record = new OrderIdempotencyRecord();
        record.operation = operation;
        record.customerId = customerId;
        record.idempotencyKey = idempotencyKey;
        record.payloadHash = payloadHash;
        record.customerOrder = customerOrder;
        record.createdAt = createdAt;
        return record;
    }

    public UUID getId() { return id; }
    public String getOperation() { return operation; }
    public UUID getIdempotencyKey() { return idempotencyKey; }
    public UUID getCustomerId() { return customerId; }
    public String getPayloadHash() { return payloadHash; }
    public CustomerOrder getCustomerOrder() { return customerOrder; }
    public Instant getCreatedAt() { return createdAt; }
}