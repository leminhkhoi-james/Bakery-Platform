package com.se193262.bakeryservice.feature.bakery.entity;

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
@Table(name = "service_areas")
public class ServiceArea extends UuidEntity {


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

    public ServiceArea() {
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

    public void setBakery(Bakery value) { this.bakery = value; }
    public void setCity(String value) { this.city = value; }
    public void setDistrict(String value) { this.district = value; }
    public void setDeliveryFee(BigDecimal value) { this.deliveryFee = value; }
    public void setMinimumOrder(BigDecimal value) { this.minimumOrder = value; }
    public void setActive(boolean value) { this.isActive = value; }
}
