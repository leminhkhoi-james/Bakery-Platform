package com.se193262.orderservice.feature.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "delivery_address_snapshots")
public class DeliveryAddressSnapshot {

    @Id
    @Column(name = "order_id")
    private UUID id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder customerOrder;

    @Column(name = "recipient_name", nullable = false, length = 120)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 30)
    private String recipientPhone;

    @Column(name = "address_line", nullable = false, length = 255)
    private String addressLine;

    @Column(name = "ward", length = 120)
    private String ward;

    @Column(name = "district", nullable = false, length = 120)
    private String district;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 6)
    private BigDecimal longitude;

    @Column(name = "delivery_note")
    private String deliveryNote;

    protected DeliveryAddressSnapshot() {
    }

    static DeliveryAddressSnapshot snapshot(
            CustomerOrder customerOrder,
            String recipientName,
            String recipientPhone,
            String addressLine,
            String ward,
            String district,
            String city,
            BigDecimal latitude,
            BigDecimal longitude,
            String deliveryNote) {
        DeliveryAddressSnapshot snapshot = new DeliveryAddressSnapshot();
        snapshot.customerOrder = customerOrder;
        snapshot.recipientName = recipientName;
        snapshot.recipientPhone = recipientPhone;
        snapshot.addressLine = addressLine;
        snapshot.ward = ward;
        snapshot.district = district;
        snapshot.city = city;
        snapshot.latitude = latitude;
        snapshot.longitude = longitude;
        snapshot.deliveryNote = deliveryNote;
        return snapshot;
    }

    public UUID getId() { return id; }
    public CustomerOrder getCustomerOrder() { return customerOrder; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public String getAddressLine() { return addressLine; }
    public String getWard() { return ward; }
    public String getDistrict() { return district; }
    public String getCity() { return city; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public String getDeliveryNote() { return deliveryNote; }
}