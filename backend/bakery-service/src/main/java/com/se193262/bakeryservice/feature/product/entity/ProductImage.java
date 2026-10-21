package com.se193262.bakeryservice.feature.product.entity;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_images")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "media_type", nullable = false, length = 100)
    private String mediaType;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ProductImage() {
    }

    public ProductImage(Product product, String objectKey, String mediaType) {
        this.product = product;
        this.objectKey = objectKey;
        this.mediaType = mediaType;
    }

    public UUID getId() { return id; }
    public Product getProduct() { return product; }
    public String getObjectKey() { return objectKey; }
    public String getMediaType() { return mediaType; }
    public int getDisplayOrder() { return displayOrder; }
    public boolean isPrimary() { return isPrimary; }
    public Instant getCreatedAt() { return createdAt; }
}
