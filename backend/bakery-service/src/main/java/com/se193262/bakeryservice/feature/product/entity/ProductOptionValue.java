package com.se193262.bakeryservice.feature.product.entity;

import com.se193262.platform.persistence.UuidEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "product_option_values")
public class ProductOptionValue extends UuidEntity {


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "option_group_id", nullable = false)
    private ProductOptionGroup optionGroup;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(name = "active", nullable = false)
    private boolean isActive = true;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    public ProductOptionValue() {
    }

    public ProductOptionValue(ProductOptionGroup optionGroup, String name, BigDecimal priceAdjustment) {
        this.optionGroup = optionGroup;
        this.name = name;
        this.priceAdjustment = priceAdjustment;
    }

    public void update(ProductOptionGroup optionGroup, String name, String description,
                       BigDecimal priceAdjustment, boolean active, int displayOrder) {
        this.optionGroup = optionGroup;
        this.name = name;
        this.description = description;
        this.priceAdjustment = priceAdjustment;
        this.isActive = active;
        this.displayOrder = displayOrder;
    }

    public UUID getId() { return id; }
    public ProductOptionGroup getOptionGroup() { return optionGroup; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPriceAdjustment() { return priceAdjustment; }
    public boolean isActive() { return isActive; }
    public int getDisplayOrder() { return displayOrder; }

    public void setOptionGroup(ProductOptionGroup value) { this.optionGroup = value; }
    public void setName(String value) { this.name = value; }
    public void setPriceAdjustment(BigDecimal value) { this.priceAdjustment = value; }
    public void setActive(boolean value) { this.isActive = value; }
    public void setDisplayOrder(int value) { this.displayOrder = value; }
}
