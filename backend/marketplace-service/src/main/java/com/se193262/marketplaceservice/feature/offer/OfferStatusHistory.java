package com.se193262.marketplaceservice.feature.offer;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "offer_status_history")
public class OfferStatusHistory {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "offer_id", nullable = false)
    private UUID offerId;

    @Column(name = "from_status", nullable = true, length = 30)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 30)
    private String toStatus;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @Column(name = "reason", nullable = true, columnDefinition = "text")
    private String reason;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected OfferStatusHistory() {}

    public static OfferStatusHistory create() {
        return new OfferStatusHistory();
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

    public String getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(String value) {
        this.fromStatus = value;
    }

    public String getToStatus() {
        return toStatus;
    }

    public void setToStatus(String value) {
        this.toStatus = value;
    }

    public UUID getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(UUID value) {
        this.changedBy = value;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String value) {
        this.reason = value;
    }

    public Instant getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(Instant value) {
        this.changedAt = value;
    }
}
