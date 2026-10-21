package com.se193262.bakeryservice.feature.bakery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "service_areas")
public class ServiceArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "district", nullable = false, length = 120)
    private String district;

    @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "minimum_order", nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumOrder = BigDecimal.ZERO;

    @Column(name = "active", nullable = false)
    private boolean isActive = true;

    protected ServiceArea() {
    }

    public ServiceArea(Bakery bakery, String city, String district) {
        this.bakery = bakery;
        this.city = city;
        this.district = district;
    }

    public void update(String city, String district, BigDecimal deliveryFee,
                       BigDecimal minimumOrder, boolean active) {
        this.city = city;
        this.district = district;
        this.deliveryFee = deliveryFee;
        this.minimumOrder = minimumOrder;
        this.isActive = active;
    }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public String getCity() { return city; }
    public String getDistrict() { return district; }
    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public BigDecimal getMinimumOrder() { return minimumOrder; }
    public boolean isActive() { return isActive; }
}
