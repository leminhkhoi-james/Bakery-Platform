package com.se193262.marketplaceservice.feature.offer;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "offer_acceptance_workflows")
public class OfferAcceptanceWorkflow {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "cake_request_id", nullable = false)
    private UUID cakeRequestId;

    @Column(name = "offer_id", nullable = false)
    private UUID offerId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "idempotency_key", nullable = false, length = 128)
    private String idempotencyKey;

    @Column(name = "payload_fingerprint", nullable = false, length = 64)
    private String payloadFingerprint;

    @Column(name = "delivery_address_id", nullable = false)
    private UUID deliveryAddressId;

    @Column(name = "customer_note", nullable = true, length = 2000)
    private String customerNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AcceptanceStatus status;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount;

    @Column(name = "next_retry_at", nullable = false)
    private Instant nextRetryAt;

    @Column(name = "lease_until", nullable = true)
    private Instant leaseUntil;

    @Column(name = "lease_owner", nullable = true)
    private UUID leaseOwner;

    @Column(name = "order_id", nullable = true)
    private UUID orderId;

    @Column(name = "order_number", nullable = true, length = 40)
    private String orderNumber;

    @Column(name = "error_status", nullable = true)
    private Integer errorStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected OfferAcceptanceWorkflow() {}

    public static OfferAcceptanceWorkflow create() {
        return new OfferAcceptanceWorkflow();
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

    public UUID getOfferId() {
        return offerId;
    }

    public void setOfferId(UUID value) {
        this.offerId = value;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID value) {
        this.customerId = value;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String value) {
        this.idempotencyKey = value;
    }

    public String getPayloadFingerprint() {
        return payloadFingerprint;
    }

    public void setPayloadFingerprint(String value) {
        this.payloadFingerprint = value;
    }

    public UUID getDeliveryAddressId() {
        return deliveryAddressId;
    }

    public void setDeliveryAddressId(UUID value) {
        this.deliveryAddressId = value;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String value) {
        this.customerNote = value;
    }

    public AcceptanceStatus getStatus() {
        return status;
    }

    public void setStatus(AcceptanceStatus value) {
        this.status = value;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer value) {
        this.attemptCount = value;
    }

    public Instant getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(Instant value) {
        this.nextRetryAt = value;
    }

    public Instant getLeaseUntil() {
        return leaseUntil;
    }

    public void setLeaseUntil(Instant value) {
        this.leaseUntil = value;
    }

    public UUID getLeaseOwner() {
        return leaseOwner;
    }

    public void setLeaseOwner(UUID value) {
        this.leaseOwner = value;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public void setOrderId(UUID value) {
        this.orderId = value;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String value) {
        this.orderNumber = value;
    }

    public Integer getErrorStatus() {
        return errorStatus;
    }

    public void setErrorStatus(Integer value) {
        this.errorStatus = value;
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
