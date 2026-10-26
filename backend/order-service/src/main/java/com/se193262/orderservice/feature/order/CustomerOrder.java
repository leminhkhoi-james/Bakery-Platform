package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.review.OrderReview;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "order_number", nullable = false, unique = true, length = 40)
    private String orderNumber;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "bakery_id", nullable = false)
    private UUID bakeryId;

    @Column(name = "cake_request_id")
    private UUID cakeRequestId;

    @Column(name = "offer_id", unique = true)
    private UUID offerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_source", nullable = false, length = 30)
    private OrderSource orderSource;

    @Column(name = "customer_name_snapshot", nullable = false, length = 120)
    private String customerNameSnapshot;

    @Column(name = "customer_phone_snapshot", nullable = false, length = 30)
    private String customerPhoneSnapshot;

    @Column(name = "bakery_name_snapshot", nullable = false, length = 180)
    private String bakeryNameSnapshot;

    @Column(name = "customer_note")
    private String customerNote;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OrderStatus status;

    @Column(name = "needed_at", nullable = false)
    private Instant neededAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @OneToMany(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private DeliveryAddressSnapshot deliveryAddressSnapshot;

    @OneToMany(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    @OneToOne(mappedBy = "customerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private OrderReview review;

    protected CustomerOrder() {
    }

    static CustomerOrder create(
            UUID customerId,
            UUID bakeryId,
            UUID cakeRequestId,
            UUID offerId,
            OrderSource orderSource,
            String customerName,
            String customerPhone,
            String bakeryName,
            String customerNote,
            BigDecimal subtotal,
            BigDecimal deliveryFee,
            BigDecimal totalAmount,
            Instant neededAt,
            Instant now) {
        CustomerOrder order = new CustomerOrder();
        order.orderNumber = "ORD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase();
        order.customerId = customerId;
        order.bakeryId = bakeryId;
        order.cakeRequestId = cakeRequestId;
        order.offerId = offerId;
        order.orderSource = orderSource;
        order.customerNameSnapshot = customerName;
        order.customerPhoneSnapshot = customerPhone;
        order.bakeryNameSnapshot = bakeryName;
        order.customerNote = customerNote;
        order.subtotal = subtotal;
        order.deliveryFee = deliveryFee;
        order.totalAmount = totalAmount;
        order.currency = "VND";
        order.status = OrderStatus.PENDING;
        order.neededAt = neededAt;
        order.createdAt = now;
        order.updatedAt = now;
        return order;
    }

    void addItem(OrderItem item) {
        items.add(item);
    }

    void setDeliveryAddressSnapshot(DeliveryAddressSnapshot snapshot) {
        deliveryAddressSnapshot = snapshot;
    }

    void addInitialStatusHistory(UUID changedBy, Instant changedAt) {
        statusHistory.add(OrderStatusHistory.initial(this, changedBy, changedAt));
    }

    void transitionTo(OrderStatus targetStatus, UUID changedBy, String note, Instant changedAt) {
        boolean allowed = switch (status) {
            case PENDING -> targetStatus == OrderStatus.CONFIRMED || targetStatus == OrderStatus.CANCELLED;
            case CONFIRMED -> targetStatus == OrderStatus.BAKING || targetStatus == OrderStatus.CANCELLED;
            case BAKING -> targetStatus == OrderStatus.READY;
            case READY -> targetStatus == OrderStatus.DELIVERING;
            case DELIVERING -> targetStatus == OrderStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!allowed) {
            throw new OrderConflictException("Order cannot transition from " + status + " to " + targetStatus);
        }

        OrderStatus previousStatus = status;
        status = targetStatus;
        updatedAt = changedAt;
        if (targetStatus == OrderStatus.CONFIRMED && acceptedAt == null) {
            acceptedAt = changedAt;
        }
        if (targetStatus == OrderStatus.COMPLETED) {
            completedAt = changedAt;
        }
        statusHistory.add(OrderStatusHistory.transition(this, previousStatus, targetStatus, changedBy, note, changedAt));
    }

    void attachReview(OrderReview orderReview) {
        if (review != null) {
            throw new OrderConflictException("Order already has a review");
        }
        review = orderReview;
    }

    public UUID getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public UUID getCustomerId() { return customerId; }
    public UUID getBakeryId() { return bakeryId; }
    public UUID getCakeRequestId() { return cakeRequestId; }
    public UUID getOfferId() { return offerId; }
    public OrderSource getOrderSource() { return orderSource; }
    public String getCustomerNameSnapshot() { return customerNameSnapshot; }
    public String getCustomerPhoneSnapshot() { return customerPhoneSnapshot; }
    public String getBakeryNameSnapshot() { return bakeryNameSnapshot; }
    public String getCustomerNote() { return customerNote; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getCurrency() { return currency; }
    public OrderStatus getStatus() { return status; }
    public Instant getNeededAt() { return neededAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
    public List<OrderItem> getItems() { return items; }
    public DeliveryAddressSnapshot getDeliveryAddressSnapshot() { return deliveryAddressSnapshot; }
    public List<OrderStatusHistory> getStatusHistory() { return statusHistory; }
    public OrderReview getReview() { return review; }
}