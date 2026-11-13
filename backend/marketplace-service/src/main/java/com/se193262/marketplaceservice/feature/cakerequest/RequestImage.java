package com.se193262.marketplaceservice.feature.cakerequest;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "request_images")
public class RequestImage {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "cake_request_id", nullable = false)
    private UUID cakeRequestId;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "media_type", nullable = false, length = 100)
    private String mediaType;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes = 0L;

    protected RequestImage() {}

    public static RequestImage create() {
        return new RequestImage();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID value) {
        this.id = value;
    }

    public UUID getCakeRequestId() {
        return cakeRequestId;
    }

    public void setCakeRequestId(UUID value) {
        this.cakeRequestId = value;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String value) {
        this.objectKey = value;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String value) {
        this.mediaType = value;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer value) {
        this.displayOrder = value;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant value) {
        this.createdAt = value;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long value) {
        this.sizeBytes = value;
    }
}
