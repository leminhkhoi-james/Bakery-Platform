package com.se193262.identityservice.feature.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "customer_profiles")
public class CustomerProfile {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "avatar_object_key", length = 512)
    private String avatarObjectKey;

    @Column(name = "preferred_language", nullable = false, length = 10)
    private String preferredLanguage;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CustomerProfile() {
    }

    public CustomerProfile(User user, String preferredLanguage, Instant updatedAt) {
        this.user = user;
        this.preferredLanguage = preferredLanguage;
        this.updatedAt = updatedAt;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getAvatarObjectKey() {
        return avatarObjectKey;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
