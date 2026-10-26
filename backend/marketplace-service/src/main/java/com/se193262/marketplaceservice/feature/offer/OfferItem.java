package com.se193262.marketplaceservice.feature.offer;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.*;

@Entity
@Table(name = "offer_items")
public class OfferItem {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "offer_id", nullable = false)
    private UUID offerId;

    @Column(name = "add_on_id", nullable = true)
    private UUID addOnId;

    @Column(name = "item_name_snapshot", nullable = false, length = 160)
    private String itemNameSnapshot;

    @Column(name = "description_snapshot", nullable = true, columnDefinition = "text")
    private String descriptionSnapshot;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    protected OfferItem() {}

    public static OfferItem create() {
        return new OfferItem();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID value) {
        this.id = value;
    }

    public UUID getOfferId() {
        return offerId;
    }

    public void setOfferId(UUID value) {
        this.offerId = value;
    }

    public UUID getAddOnId() {
        return addOnId;
    }

    public void setAddOnId(UUID value) {
        this.addOnId = value;
    }

    public String getItemNameSnapshot() {
        return itemNameSnapshot;
    }

    public void setItemNameSnapshot(String value) {
        this.itemNameSnapshot = value;
    }

    public String getDescriptionSnapshot() {
        return descriptionSnapshot;
    }

    public void setDescriptionSnapshot(String value) {
        this.descriptionSnapshot = value;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer value) {
        this.quantity = value;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal value) {
        this.unitPrice = value;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal value) {
        this.lineTotal = value;
    }
}
