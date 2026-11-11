package com.se193262.identityservice.feature.user;

import com.se193262.platform.persistence.UuidEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User extends UuidEntity {


    @Column(name = "email", nullable = false, unique = true, length = 320)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new LinkedHashSet<>();

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private CustomerProfile customerProfile;

    public User() {
    }

    public User(
            String email,
            String passwordHash,
            String displayName,
            String phoneNumber,
            UserStatus status,
            Instant now
    ) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.emailVerified = false;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void addRole(Role role) {
        roles.add(role);
    }

    public void setCustomerProfile(CustomerProfile customerProfile) {
        this.customerProfile = customerProfile;
    }

    public void updateProfile(String displayName, String phoneNumber, Instant now) {
        if (displayName != null) {
            this.displayName = displayName;
        }
        if (phoneNumber != null) {
            this.phoneNumber = phoneNumber;
        }
        this.updatedAt = now;
    }

    public void changeStatus(UserStatus status, Instant now) {
        this.status = status;
        this.updatedAt = now;
    }

    public void replaceRoles(Set<Role> roles, Instant now) {
        this.roles.clear();
        this.roles.addAll(roles);
        this.updatedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public UserStatus getStatus() {
        return status;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<Role> getRoles() {
        return Set.copyOf(roles);
    }

    public CustomerProfile getCustomerProfile() {
        return customerProfile;
    }

    public void setEmail(String value) { this.email = value; }
    public void setPasswordHash(String value) { this.passwordHash = value; }
    public void setDisplayName(String value) { this.displayName = value; }
    public void setPhoneNumber(String value) { this.phoneNumber = value; }
    public void setStatus(UserStatus value) { this.status = value; }
    public void setEmailVerified(boolean value) { this.emailVerified = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
}
