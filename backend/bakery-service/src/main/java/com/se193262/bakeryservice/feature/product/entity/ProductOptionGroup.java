package com.se193262.bakeryservice.feature.product.entity;

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

import java.util.UUID;

@Entity
@Table(name = "product_option_groups")
public class ProductOptionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "selection_type", nullable = false, length = 30)
    private SelectionType selectionType;

    @Column(name = "required", nullable = false)
    private boolean isRequired;

    @Column(name = "minimum_selections", nullable = false)
    private int minimumSelections;

    @Column(name = "maximum_selections", nullable = false)
    private int maximumSelections = 1;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ProductOptionGroup() {
    }

    public ProductOptionGroup(Product product, String name, SelectionType selectionType) {
        this.product = product;
        this.name = name;
        this.selectionType = selectionType;
    }

    public void update(String name, SelectionType selectionType, boolean required,
                       int minimumSelections, int maximumSelections, int displayOrder) {
        this.name = name;
        this.selectionType = selectionType;
        this.isRequired = required;
        this.minimumSelections = minimumSelections;
        this.maximumSelections = maximumSelections;
        this.displayOrder = displayOrder;
    }

    public UUID getId() { return id; }
    public Product getProduct() { return product; }
    public String getName() { return name; }
    public SelectionType getSelectionType() { return selectionType; }
    public boolean isRequired() { return isRequired; }
    public int getMinimumSelections() { return minimumSelections; }
    public int getMaximumSelections() { return maximumSelections; }
    public int getDisplayOrder() { return displayOrder; }
}
