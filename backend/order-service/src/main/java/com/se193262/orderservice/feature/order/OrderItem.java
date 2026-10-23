package com.se193262.orderservice.feature.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder customerOrder;

    @Column(name = "source_product_id")
    private UUID sourceProductId;

    @Column(name = "source_offer_item_id")
    private UUID sourceOfferItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 30)
    private OrderItemType itemType;

    @Column(name = "name_snapshot", nullable = false, length = 180)
    private String nameSnapshot;

    @Column(name = "description_snapshot")
    private String descriptionSnapshot;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "configuration_snapshot", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> configurationSnapshot;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItem() {
    }

    static OrderItem snapshot(
            CustomerOrder customerOrder,
            UUID sourceProductId,
            UUID sourceOfferItemId,
            OrderItemType itemType,
            String name,
            String description,
            Map<String, Object> configuration,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
        OrderItem item = new OrderItem();
        item.customerOrder = customerOrder;
        item.sourceProductId = sourceProductId;
        item.sourceOfferItemId = sourceOfferItemId;
        item.itemType = itemType;
        item.nameSnapshot = name;
        item.descriptionSnapshot = description;
        item.configurationSnapshot = configuration == null ? Map.of() : Map.copyOf(configuration);
        item.quantity = quantity;
        item.unitPrice = unitPrice;
        item.lineTotal = lineTotal;
        return item;
    }

    public UUID getId() { return id; }
    public CustomerOrder getCustomerOrder() { return customerOrder; }
    public UUID getSourceProductId() { return sourceProductId; }
    public UUID getSourceOfferItemId() { return sourceOfferItemId; }
    public OrderItemType getItemType() { return itemType; }
    public String getNameSnapshot() { return nameSnapshot; }
    public String getDescriptionSnapshot() { return descriptionSnapshot; }
    public Map<String, Object> getConfigurationSnapshot() { return configurationSnapshot; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
}