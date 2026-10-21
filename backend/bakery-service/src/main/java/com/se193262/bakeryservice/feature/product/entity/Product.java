package com.se193262.bakeryservice.feature.product.entity;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.category.entity.ProductCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    @Column(name = "slug", nullable = false, length = 200)
    private String slug;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ProductStatus status = ProductStatus.DRAFT;

    @Column(name = "customizable", nullable = false)
    private boolean isCustomizable;

    @Column(name = "default_serving_size")
    private Integer defaultServingSize;

    @Column(name = "minimum_notice_hours", nullable = false)
    private int minimumNoticeHours;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected Product() {
    }

    public Product(Bakery bakery, ProductCategory category, String name, String slug, BigDecimal basePrice) {
        this.bakery = bakery;
        this.category = category;
        this.name = name;
        this.slug = slug;
        this.basePrice = basePrice;
    }

    public void updateCategory(ProductCategory category) {
        this.category = category;
    }

    public void updateDetails(String name, String slug, String description, BigDecimal basePrice,
                              Boolean customizable, Integer defaultServingSize, Integer minimumNoticeHours) {
        if (name != null) this.name = name;
        if (slug != null) this.slug = slug;
        if (description != null) this.description = description;
        if (basePrice != null) this.basePrice = basePrice;
        if (customizable != null) this.isCustomizable = customizable;
        if (defaultServingSize != null) this.defaultServingSize = defaultServingSize;
        if (minimumNoticeHours != null) this.minimumNoticeHours = minimumNoticeHours;
    }

    public void publish() {
        if (status != ProductStatus.DRAFT && status != ProductStatus.HIDDEN) {
            throw new IllegalStateException("Only draft or hidden products can be published");
        }
        status = ProductStatus.PUBLISHED;
    }

    public void hide() {
        if (status != ProductStatus.PUBLISHED) {
            throw new IllegalStateException("Only a published product can be hidden");
        }
        status = ProductStatus.HIDDEN;
    }

    public void archive() {
        if (status == ProductStatus.ARCHIVED) {
            throw new IllegalStateException("Product is already archived");
        }
        status = ProductStatus.ARCHIVED;
    }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public ProductCategory getCategory() { return category; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getDescription() { return description; }
    public BigDecimal getBasePrice() { return basePrice; }
    public ProductStatus getStatus() { return status; }
    public boolean isCustomizable() { return isCustomizable; }
    public Integer getDefaultServingSize() { return defaultServingSize; }
    public int getMinimumNoticeHours() { return minimumNoticeHours; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
