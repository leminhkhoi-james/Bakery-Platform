package com.se193262.subscriptionservice.feature.payment.entity;

import com.se193262.platform.persistence.UuidEntity;

import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bakery_payments")
public class BakeryPayment extends UuidEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscription_order_id", nullable = false)
    private SubscriptionOrder order;
    @Column(name = "submitted_by_user_id", nullable = false)
    private UUID submittedByUserId;
    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;
    @Column(name = "verification_source", nullable = false, length = 20)
    private String verificationSource = "MANUAL";
    @Column(name = "payment_reference", unique = true, length = 120)
    private String paymentReference;
    @Column(name = "idempotency_key_hash", unique = true, length = 64)
    private String idempotencyKeyHash;
    @Column(name = "review_idempotency_key_hash", unique = true, length = 64)
    private String reviewIdempotencyKeyHash;
    @Column(name = "proof_object_key", length = 512)
    private String proofObjectKey;
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PaymentStatus status = PaymentStatus.SUBMITTED;
    @Column(name = "reviewed_by_admin_id")
    private UUID reviewedByAdminId;
    @Column(name = "review_note", columnDefinition = "text")
    private String reviewNote;
    @CreationTimestamp @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    @Version @Column(name = "version", nullable = false)
    private long version;

    public BakeryPayment() {}

    public BakeryPayment(SubscriptionOrder order, UUID submittedByUserId, String paymentMethod,
                         String paymentReference, String idempotencyKeyHash,
                         BigDecimal amount, String currency, String proofObjectKey) {
        this.order = order;
        this.submittedByUserId = submittedByUserId;
        this.paymentMethod = paymentMethod;
        this.paymentReference = paymentReference;
        this.idempotencyKeyHash = idempotencyKeyHash;
        this.amount = amount;
        this.currency = currency;
        this.proofObjectKey = proofObjectKey;
    }

    public void approve(UUID adminId, String note, String reviewKeyHash, Instant now) {
        this.status = PaymentStatus.APPROVED;
        this.reviewedByAdminId = adminId;
        this.reviewNote = note;
        this.reviewedAt = now;
        this.reviewIdempotencyKeyHash = reviewKeyHash;
    }

    public void verifiedByVnpay() { this.verificationSource = "VNPAY"; }

    public void reject(UUID adminId, String note, Instant now) {
        this.status = PaymentStatus.REJECTED;
        this.reviewedByAdminId = adminId;
        this.reviewNote = note;
        this.reviewedAt = now;
    }

    public UUID getId() { return id; }
    public SubscriptionOrder getOrder() { return order; }
    public UUID getSubmittedByUserId() { return submittedByUserId; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentReference() { return paymentReference; }
    public String getIdempotencyKeyHash() { return idempotencyKeyHash; }
    public String getReviewIdempotencyKeyHash() { return reviewIdempotencyKeyHash; }
    public String getProofObjectKey() { return proofObjectKey; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public PaymentStatus getStatus() { return status; }
    public UUID getReviewedByAdminId() { return reviewedByAdminId; }
    public String getReviewNote() { return reviewNote; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getReviewedAt() { return reviewedAt; }

    public void setOrder(SubscriptionOrder value) { this.order = value; }
    public void setSubmittedByUserId(UUID value) { this.submittedByUserId = value; }
    public void setPaymentMethod(String value) { this.paymentMethod = value; }
    public void setPaymentReference(String value) { this.paymentReference = value; }
    public void setAmount(BigDecimal value) { this.amount = value; }
    public void setCurrency(String value) { this.currency = value; }
    public void setStatus(PaymentStatus value) { this.status = value; }
    public void setReviewedByAdminId(UUID value) { this.reviewedByAdminId = value; }
    public void setReviewNote(String value) { this.reviewNote = value; }
    public void setSubmittedAt(Instant value) { this.submittedAt = value; }
    public void setReviewedAt(Instant value) { this.reviewedAt = value; }
    public void setVerificationSource(String value) { this.verificationSource = value; }
}
