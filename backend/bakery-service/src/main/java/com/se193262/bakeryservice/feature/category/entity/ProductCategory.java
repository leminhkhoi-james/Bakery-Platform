package com.se193262.bakeryservice.feature.category.entity;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_categories")
public class ProductCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "slug", nullable = false, length = 140)
    private String slug;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductCategory() {
    }

    public ProductCategory(Bakery bakery, String name, String slug) {
        this.bakery = bakery;
        this.name = name;
        this.slug = slug;
    }

    public void update(String name, String slug, Integer displayOrder, Boolean active) {
        if (name != null) this.name = name;
        if (slug != null) this.slug = slug;
        if (displayOrder != null) this.displayOrder = displayOrder;
        if (active != null) this.isActive = active;
    }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public int getDisplayOrder() { return displayOrder; }
    public boolean isActive() { return isActive; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
