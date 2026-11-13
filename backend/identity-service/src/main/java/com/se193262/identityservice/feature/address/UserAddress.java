package com.se193262.identityservice.feature.address;

import com.se193262.platform.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "user_addresses")
public class UserAddress extends UuidEntity {
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "label", nullable = false, length = 80) private String label;
    @Column(name = "recipient_name", nullable = false, length = 120) private String recipientName;
    @Column(name = "recipient_phone", nullable = false, length = 30) private String recipientPhone;
    @Column(name = "address_line", nullable = false, length = 255) private String addressLine;
    @Column(name = "ward", length = 120) private String ward;
    @Column(name = "district", nullable = false, length = 120) private String district;
    @Column(name = "city", nullable = false, length = 120) private String city;
    @Column(name = "is_default", nullable = false) private boolean isDefault;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    public UserAddress() { }
    public String getLabel() { return label; }
    public String getRecipientName() { return recipientName; }

    public void setUserId(UUID value) { this.userId = value; }
    public void setLabel(String value) { this.label = value; }
    public void setRecipientName(String value) { this.recipientName = value; }
    public void setRecipientPhone(String value) { this.recipientPhone = value; }
    public void setAddressLine(String value) { this.addressLine = value; }
    public void setWard(String value) { this.ward = value; }
    public void setDistrict(String value) { this.district = value; }
    public void setCity(String value) { this.city = value; }
    public void setDefault(boolean value) { this.isDefault = value; }
}
