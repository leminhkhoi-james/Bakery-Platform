package com.se193262.platform.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Transient;
import java.util.UUID;

/** Technical identifier lifecycle only; no domain fields or cross-service relationships. */
@MappedSuperclass
public abstract class UuidEntity {
    @Id
    @AssignedUuid
    @Column(name = "id", nullable = false)
    protected UUID id;

    @Transient
    private UUID requestedId;

    public UUID getId() { return id; }

    public void setId(UUID id) {
        if (this.id != null) throw new IllegalStateException("Cannot change the identifier of a persisted entity");
        // Keep the actual ID null until persist, just like ordinary @GeneratedValue entities.
        this.requestedId = id;
    }

    UUID requestedId() { return requestedId; }
}
