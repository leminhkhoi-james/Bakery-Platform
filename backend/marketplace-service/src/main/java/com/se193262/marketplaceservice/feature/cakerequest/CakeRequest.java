package com.se193262.marketplaceservice.feature.cakerequest;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "cake_requests")
public class CakeRequest {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "target_bakery_id", nullable = true)
    private UUID targetBakeryId;

    @Column(name = "base_product_id", nullable = true)
    private UUID baseProductId;

    @Column(name = "selected_design_id", nullable = true)
    private UUID selectedDesignId;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 40)
    private RequestType requestType;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "occasion", nullable = true, length = 100)
    private String occasion;

    @Column(name = "serving_size", nullable = true)
    private Integer servingSize;

    @Column(name = "budget_min", nullable = true, precision = 12, scale = 2)
    private BigDecimal budgetMin;

    @Column(name = "budget_max", nullable = true, precision = 12, scale = 2)
    private BigDecimal budgetMax;

    @Column(name = "needed_at", nullable = false)
    private Instant neededAt;

    @Column(name = "delivery_district", nullable = false, length = 120)
    private String deliveryDistrict;

    @Column(name = "delivery_city", nullable = false, length = 120)
    private String deliveryCity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RequestStatus status;

    @Column(name = "offer_deadline", nullable = true)
    private Instant offerDeadline;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected CakeRequest() {}

    public static CakeRequest create() {
        return new CakeRequest();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID value) {
        this.id = value;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID value) {
        this.customerId = value;
    }

    public UUID getTargetBakeryId() {
        return targetBakeryId;
    }

    public void setTargetBakeryId(UUID value) {
        this.targetBakeryId = value;
    }

    public UUID getBaseProductId() {
        return baseProductId;
    }

    public void setBaseProductId(UUID value) {
        this.baseProductId = value;
    }

    public UUID getSelectedDesignId() {
        return selectedDesignId;
    }

    public void setSelectedDesignId(UUID value) {
        this.selectedDesignId = value;
    }

    public RequestType getRequestType() {
        return requestType;
    }

    public void setRequestType(RequestType value) {
        this.requestType = value;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String value) {
        this.title = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String value) {
        this.description = value;
    }

    public String getOccasion() {
        return occasion;
    }

    public void setOccasion(String value) {
        this.occasion = value;
    }

    public Integer getServingSize() {
        return servingSize;
    }

    public void setServingSize(Integer value) {
        this.servingSize = value;
    }

    public BigDecimal getBudgetMin() {
        return budgetMin;
    }

    public void setBudgetMin(BigDecimal value) {
        this.budgetMin = value;
    }

    public BigDecimal getBudgetMax() {
        return budgetMax;
    }

    public void setBudgetMax(BigDecimal value) {
        this.budgetMax = value;
    }

    public Instant getNeededAt() {
        return neededAt;
    }

    public void setNeededAt(Instant value) {
        this.neededAt = value;
    }

    public String getDeliveryDistrict() {
        return deliveryDistrict;
    }

    public void setDeliveryDistrict(String value) {
        this.deliveryDistrict = value;
    }

    public String getDeliveryCity() {
        return deliveryCity;
    }

    public void setDeliveryCity(String value) {
        this.deliveryCity = value;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus value) {
        this.status = value;
    }

    public Instant getOfferDeadline() {
        return offerDeadline;
    }

    public void setOfferDeadline(Instant value) {
        this.offerDeadline = value;
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
