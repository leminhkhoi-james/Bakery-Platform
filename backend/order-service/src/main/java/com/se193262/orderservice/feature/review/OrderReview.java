package com.se193262.orderservice.feature.review;

import com.se193262.orderservice.feature.order.CustomerOrder;
import com.se193262.orderservice.feature.order.OrderConflictException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_reviews")
public class OrderReview {

    @Id
    @Column(name = "order_id")
    private UUID id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder customerOrder;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "rating", nullable = false)
    private short rating;

    @Column(name = "comment")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReviewStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected OrderReview() {
    }

    static OrderReview create(CustomerOrder customerOrder, UUID customerId, short rating, String comment, Instant now) {
        OrderReview review = new OrderReview();
        review.customerOrder = customerOrder;
        review.customerId = customerId;
        review.rating = rating;
        review.comment = comment;
        review.status = ReviewStatus.PUBLISHED;
        review.createdAt = now;
        review.updatedAt = now;
        return review;
    }

    void update(short rating, String comment, Instant now) {
        if (status != ReviewStatus.PUBLISHED) {
            throw new OrderConflictException("Only published reviews can be edited");
        }
        this.rating = rating;
        this.comment = comment;
        updatedAt = now;
    }

    void softDelete(Instant now) {
        if (status == ReviewStatus.DELETED) {
            throw new OrderConflictException("Review is already deleted");
        }
        status = ReviewStatus.DELETED;
        updatedAt = now;
    }

    void moderate(ReviewStatus targetStatus, Instant now) {
        if (status == ReviewStatus.DELETED
                || (targetStatus != ReviewStatus.PUBLISHED && targetStatus != ReviewStatus.HIDDEN)
                || status == targetStatus) {
            throw new OrderConflictException("Review status transition is not allowed");
        }
        status = targetStatus;
        updatedAt = now;
    }

    public UUID getId() { return id; }
    public CustomerOrder getCustomerOrder() { return customerOrder; }
    public UUID getCustomerId() { return customerId; }
    public short getRating() { return rating; }
    public String getComment() { return comment; }
    public ReviewStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}