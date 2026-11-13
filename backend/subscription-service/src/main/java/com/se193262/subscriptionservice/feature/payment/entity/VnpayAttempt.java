package com.se193262.subscriptionservice.feature.payment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vnpay_attempts")
public class VnpayAttempt {
    public enum Status { PENDING, SUCCEEDED, FAILED, REVIEW_REQUIRED }

    @Id @Column(name = "id", nullable = false)
    private UUID id;
    @Column(name = "subscription_order_id", nullable = false)
    private UUID orderId;
    @Column(name = "submitted_by_user_id", nullable = false)
    private UUID userId;
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 30)
    private Status status = Status.PENDING;
    @Column(name = "transaction_no", unique = true, length = 30)
    private String transactionNo;
    @Column(name = "response_code", length = 2)
    private String responseCode;
    @Column(name = "transaction_status", length = 2)
    private String transactionStatus;
    @Column(name = "paid_at")
    private Instant paidAt;
    @Version @Column(name = "version", nullable = false)
    private long version;

    protected VnpayAttempt() { }

    public VnpayAttempt(UUID orderId, UUID userId, BigDecimal amount, Instant now,
                        Instant expiresAt, String ipAddress) {
        this.id = UUID.randomUUID();
        this.orderId = orderId;
        this.userId = userId;
        this.amount = amount;
        this.createdAt = now;
        this.expiresAt = expiresAt;
        this.ipAddress = ipAddress;
    }

    public void finish(Status result, String transactionNo, String responseCode,
                       String transactionStatus, Instant paidAt) {
        this.status = result;
        this.transactionNo = transactionNo;
        this.responseCode = responseCode;
        this.transactionStatus = transactionStatus;
        this.paidAt = paidAt;
    }

    public UUID getId() { return id; }
    public UUID getOrderId() { return orderId; }
    public UUID getUserId() { return userId; }
    public BigDecimal getAmount() { return amount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public String getIpAddress() { return ipAddress; }
    public Status getStatus() { return status; }
    public String getTransactionNo() { return transactionNo; }
}
