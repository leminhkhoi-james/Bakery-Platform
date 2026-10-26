package com.se193262.orderservice.feature.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder customerOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private OrderStatus toStatus;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @Column(name = "note")
    private String note;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected OrderStatusHistory() {
    }

    static OrderStatusHistory initial(CustomerOrder customerOrder, UUID changedBy, Instant changedAt) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.customerOrder = customerOrder;
        history.toStatus = OrderStatus.PENDING;
        history.changedBy = changedBy;
        history.note = "Order created";
        history.changedAt = changedAt;
        return history;
    }

    static OrderStatusHistory transition(
            CustomerOrder customerOrder,
            OrderStatus fromStatus,
            OrderStatus toStatus,
            UUID changedBy,
            String note,
            Instant changedAt) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.customerOrder = customerOrder;
        history.fromStatus = fromStatus;
        history.toStatus = toStatus;
        history.changedBy = changedBy;
        history.note = note;
        history.changedAt = changedAt;
        return history;
    }

    public UUID getId() { return id; }
    public CustomerOrder getCustomerOrder() { return customerOrder; }
    public OrderStatus getFromStatus() { return fromStatus; }
    public OrderStatus getToStatus() { return toStatus; }
    public UUID getChangedBy() { return changedBy; }
    public String getNote() { return note; }
    public Instant getChangedAt() { return changedAt; }
}