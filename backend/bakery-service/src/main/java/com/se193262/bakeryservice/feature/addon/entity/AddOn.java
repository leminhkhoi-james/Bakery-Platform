package com.se193262.bakeryservice.feature.addon.entity;

import com.se193262.platform.persistence.UuidEntity;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "add_ons")
public class AddOn extends UuidEntity {


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    @Column(name = "name", nullable = false, length = 160)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "category", nullable = false, length = 80)
    private String category;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @Column(name = "image_object_key", length = 512)
    private String imageObjectKey;

    @Column(name = "active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    public AddOn() {
    }

    public AddOn(Bakery bakery, String name, String category, BigDecimal price) {
        this.bakery = bakery;
        this.name = name;
        this.category = category;
        this.price = price;
    }

    public void update(String name, String description, String category, BigDecimal price, Boolean active) {
        if (name != null) this.name = name;
        if (description != null) this.description = description;
        if (category != null) this.category = category;
        if (price != null) this.price = price;
        if (active != null) this.isActive = active;
    }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer value) {
        if (value != null && value < 0) throw new IllegalArgumentException("Stock must be non-negative");
        this.stockQuantity = value;
    }

    public void disable() {
        this.isActive = false;
    }

    public void replaceImage(String objectKey) { this.imageObjectKey = objectKey; }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public BigDecimal getPrice() { return price; }
    public String getImageObjectKey() { return imageObjectKey; }
    public boolean isActive() { return isActive; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }

    public void setBakery(Bakery value) { this.bakery = value; }
    public void setName(String value) { this.name = value; }
    public void setCategory(String value) { this.category = value; }
    public void setPrice(BigDecimal value) { this.price = value; }
    public void setActive(boolean value) { this.isActive = value; }
}
