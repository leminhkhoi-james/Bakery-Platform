package com.se193262.subscriptionservice.feature.subscription.entity;

import com.se193262.platform.persistence.UuidEntity;

import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;
import java.util.Map;

@Entity
@Table(name = "bakery_subscriptions")
public class BakerySubscription extends UuidEntity {
    @Column(name = "bakery_id", nullable = false)
    private UUID bakeryId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_order_id", nullable = false, unique = true)
    private SubscriptionOrder sourceOrder;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SubscriptionStatus status = SubscriptionStatus.SCHEDULED;
    @Column(name = "period_start", nullable = false)
    private Instant periodStart;
    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features_snapshot", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> featuresSnapshot;
    @Column(name = "activated_at")
    private Instant activatedAt;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version @Column(name = "version", nullable = false)
    private long version;

    public BakerySubscription() {}

    public BakerySubscription(SubscriptionOrder order, Instant start, Instant end, Instant now) {
        this.bakeryId = order.getBakeryId();
        this.plan = order.getPlan();
        this.sourceOrder = order;
        this.periodStart = start;
        this.periodEnd = end;
        this.featuresSnapshot = Map.copyOf(order.getFeaturesSnapshot());
        this.status = start.isAfter(now) ? SubscriptionStatus.SCHEDULED : SubscriptionStatus.ACTIVE;
        if (this.status == SubscriptionStatus.ACTIVE) this.activatedAt = now;
    }

    public void activate(Instant now) { this.status = SubscriptionStatus.ACTIVE; this.activatedAt = now; }
    public void expire() { this.status = SubscriptionStatus.EXPIRED; }

    public UUID getId() { return id; }
    public UUID getBakeryId() { return bakeryId; }
    public SubscriptionPlan getPlan() { return plan; }
    public SubscriptionOrder getSourceOrder() { return sourceOrder; }
    public SubscriptionStatus getStatus() { return status; }
    public Instant getPeriodStart() { return periodStart; }
    public Instant getPeriodEnd() { return periodEnd; }
    public Map<String, String> getFeaturesSnapshot() { return featuresSnapshot; }
    public Instant getActivatedAt() { return activatedAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }

    public void setBakeryId(UUID value) { this.bakeryId = value; }
    public void setPlan(SubscriptionPlan value) { this.plan = value; }
    public void setSourceOrder(SubscriptionOrder value) { this.sourceOrder = value; }
    public void setStatus(SubscriptionStatus value) { this.status = value; }
    public void setPeriodStart(Instant value) { this.periodStart = value; }
    public void setPeriodEnd(Instant value) { this.periodEnd = value; }
    public void setActivatedAt(Instant value) { this.activatedAt = value; }
    public void setFeaturesSnapshot(Map<String, String> value) { this.featuresSnapshot = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
}
