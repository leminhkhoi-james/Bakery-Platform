package com.se193262.subscriptionservice.feature.plan.entity;

import com.se193262.platform.persistence.UuidEntity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan extends UuidEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;
    @Column(name = "name", nullable = false, length = 120)
    private String name;
    @Column(name = "description", columnDefinition = "text")
    private String description;
    @Column(name = "monthly_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice;
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "VND";
    @Column(name = "billing_period_months", nullable = false)
    private int billingPeriodMonths = 1;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PlanStatus status = PlanStatus.ACTIVE;
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "plan_features", joinColumns = @JoinColumn(name = "plan_id"))
    @MapKeyColumn(name = "feature_code", length = 80)
    @Column(name = "feature_value", nullable = false, length = 255)
    private Map<String, String> features = new HashMap<>();
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version @Column(name = "version", nullable = false)
    private long version;

    public SubscriptionPlan() {}

    public SubscriptionPlan(String code, String name, BigDecimal monthlyPrice) {
        this.code = code;
        this.name = name;
        this.monthlyPrice = monthlyPrice;
    }

    public void update(String code, String name, String description, BigDecimal monthlyPrice,
                       String currency, Integer billingPeriodMonths, PlanStatus status,
                       Map<String, String> features) {
        if (code != null) this.code = code;
        if (name != null) this.name = name;
        if (description != null) this.description = description;
        if (monthlyPrice != null) this.monthlyPrice = monthlyPrice;
        if (currency != null) this.currency = currency;
        if (billingPeriodMonths != null) this.billingPeriodMonths = billingPeriodMonths;
        if (status != null) this.status = status;
        if (features != null) {
            this.features.clear();
            this.features.putAll(features);
        }
    }

    public void archive() { this.status = PlanStatus.ARCHIVED; }
    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getMonthlyPrice() { return monthlyPrice; }
    public String getCurrency() { return currency; }
    public int getBillingPeriodMonths() { return billingPeriodMonths; }
    public PlanStatus getStatus() { return status; }
    public Map<String, String> getFeatures() { return features; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }

    public void setCode(String value) { this.code = value; }
    public void setName(String value) { this.name = value; }
    public void setMonthlyPrice(BigDecimal value) { this.monthlyPrice = value; }
    public void setCurrency(String value) { this.currency = value; }
    public void setBillingPeriodMonths(int value) { this.billingPeriodMonths = value; }
    public void setStatus(PlanStatus value) { this.status = value; }
    public void setFeatures(Map<String, String> value) { this.features = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
}
