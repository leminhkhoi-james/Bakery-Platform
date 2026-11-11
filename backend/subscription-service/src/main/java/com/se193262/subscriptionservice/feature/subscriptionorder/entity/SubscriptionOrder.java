package com.se193262.subscriptionservice.feature.subscriptionorder.entity;

import com.se193262.platform.persistence.UuidEntity;

import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
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
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.Map;

@Entity
@Table(name = "subscription_orders")
public class SubscriptionOrder extends UuidEntity {
    @Column(name = "order_number", nullable = false, unique = true, length = 40)
    private String orderNumber;
    @Column(name = "bakery_id", nullable = false)
    private UUID bakeryId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;
    @Column(name = "requested_by_user_id", nullable = false)
    private UUID requestedByUserId;
    @Column(name = "plan_name_snapshot", nullable = false, length = 120)
    private String planNameSnapshot;
    @Column(name = "plan_code_snapshot", nullable = false, length = 50)
    private String planCodeSnapshot;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features_snapshot", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> featuresSnapshot;
    @Column(name = "billing_period_months", nullable = false)
    private int billingPeriodMonths;
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SubscriptionOrderStatus status = SubscriptionOrderStatus.PENDING_PAYMENT;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "completed_at")
    private Instant completedAt;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version @Column(name = "version", nullable = false)
    private long version;

    public SubscriptionOrder() {}

    public SubscriptionOrder(String orderNumber, UUID bakeryId, SubscriptionPlan plan,
                             UUID requestedByUserId, Instant expiresAt) {
        this.orderNumber = orderNumber;
        this.bakeryId = bakeryId;
        this.plan = plan;
        this.requestedByUserId = requestedByUserId;
        this.planNameSnapshot = plan.getName();
        this.planCodeSnapshot = plan.getCode();
        this.featuresSnapshot = Map.copyOf(plan.getFeatures());
        this.billingPeriodMonths = plan.getBillingPeriodMonths();
        this.totalAmount = plan.getMonthlyPrice().multiply(BigDecimal.valueOf(plan.getBillingPeriodMonths()));
        this.currency = plan.getCurrency();
        this.expiresAt = expiresAt;
    }

    public void submitPayment() { this.status = SubscriptionOrderStatus.PAYMENT_REVIEW; }
    public void complete(Instant now) { this.status = SubscriptionOrderStatus.COMPLETED; this.completedAt = now; }
    public void rejectPayment(Instant now) {
        this.status = expiresAt.isAfter(now) ? SubscriptionOrderStatus.PENDING_PAYMENT : SubscriptionOrderStatus.EXPIRED;
    }
    public void expire() { this.status = SubscriptionOrderStatus.EXPIRED; }
    public UUID getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public UUID getBakeryId() { return bakeryId; }
    public SubscriptionPlan getPlan() { return plan; }
    public UUID getRequestedByUserId() { return requestedByUserId; }
    public String getPlanNameSnapshot() { return planNameSnapshot; }
    public String getPlanCodeSnapshot() { return planCodeSnapshot; }
    public Map<String, String> getFeaturesSnapshot() { return featuresSnapshot; }
    public int getBillingPeriodMonths() { return billingPeriodMonths; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getCurrency() { return currency; }
    public SubscriptionOrderStatus getStatus() { return status; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }

    public void setOrderNumber(String value) { this.orderNumber = value; }
    public void setBakeryId(UUID value) { this.bakeryId = value; }
    public void setPlan(SubscriptionPlan value) { this.plan = value; }
    public void setRequestedByUserId(UUID value) { this.requestedByUserId = value; }
    public void setPlanNameSnapshot(String value) { this.planNameSnapshot = value; }
    public void setPlanCodeSnapshot(String value) { this.planCodeSnapshot = value; }
    public void setFeaturesSnapshot(Map<String, String> value) { this.featuresSnapshot = value; }
    public void setBillingPeriodMonths(int value) { this.billingPeriodMonths = value; }
    public void setTotalAmount(BigDecimal value) { this.totalAmount = value; }
    public void setCurrency(String value) { this.currency = value; }
    public void setStatus(SubscriptionOrderStatus value) { this.status = value; }
    public void setExpiresAt(Instant value) { this.expiresAt = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
    public void setCompletedAt(Instant value) { this.completedAt = value; }
}
