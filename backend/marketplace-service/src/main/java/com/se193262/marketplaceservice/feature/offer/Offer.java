package com.se193262.marketplaceservice.feature.offer;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "offers")
public class Offer {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "cake_request_id", nullable = false)
    private UUID cakeRequestId;

    @Column(name = "bakery_id", nullable = false)
    private UUID bakeryId;

    @Column(name = "message", nullable = true, columnDefinition = "text")
    private String message;

    @Column(name = "cake_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal cakePrice;

    @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "add_on_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal addOnTotal;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "estimated_completion_at", nullable = false)
    private Instant estimatedCompletionAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OfferStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected Offer() {}

    public static Offer create() {
        return new Offer();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID value) {
        this.id = value;
    }

    public UUID getCakeRequestId() {
        return cakeRequestId;
    }

    public void setCakeRequestId(UUID value) {
        this.cakeRequestId = value;
    }

    public UUID getBakeryId() {
        return bakeryId;
    }

    public void setBakeryId(UUID value) {
        this.bakeryId = value;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String value) {
        this.message = value;
    }

    public BigDecimal getCakePrice() {
        return cakePrice;
    }

    public void setCakePrice(BigDecimal value) {
        this.cakePrice = value;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal value) {
        this.deliveryFee = value;
    }

    public BigDecimal getAddOnTotal() {
        return addOnTotal;
    }

    public void setAddOnTotal(BigDecimal value) {
        this.addOnTotal = value;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal value) {
        this.totalPrice = value;
    }

    public Instant getEstimatedCompletionAt() {
        return estimatedCompletionAt;
    }

    public void setEstimatedCompletionAt(Instant value) {
        this.estimatedCompletionAt = value;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant value) {
        this.expiresAt = value;
    }

    public OfferStatus getStatus() {
        return status;
    }

    public void setStatus(OfferStatus value) {
        this.status = value;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant value) {
        this.createdAt = value;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant value) {
        this.updatedAt = value;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long value) {
        this.version = value;
    }
}
