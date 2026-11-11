package com.se193262.bakeryservice.feature.member.entity;

import com.se193262.platform.persistence.UuidEntity;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bakery_members")
public class BakeryMember extends UuidEntity {


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    // Identity owns the user; the local name is a snapshot, not a shared user entity.
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "display_name_snapshot", length = 120)
    private String displayNameSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 30)
    private BakeryMemberRole memberRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private BakeryMemberStatus status = BakeryMemberStatus.ACTIVE;

    @Column(name = "owner_activation_pending", nullable = false)
    private boolean ownerActivationPending;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public BakeryMember() {
    }

    public BakeryMember(Bakery bakery, UUID userId, BakeryMemberRole memberRole) {
        this.bakery = bakery;
        this.userId = userId;
        this.memberRole = memberRole;
    }

    public BakeryMember(Bakery bakery, UUID userId, BakeryMemberRole memberRole, String displayNameSnapshot) {
        this(bakery, userId, memberRole);
        this.displayNameSnapshot = displayNameSnapshot;
    }

    public void update(BakeryMemberRole role, BakeryMemberStatus status) {
        if (role != null) this.memberRole = role;
        if (status != null) this.status = status;
    }

    public void requestOwnerActivation() { ownerActivationPending = true; }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public UUID getUserId() { return userId; }
    public String getDisplayNameSnapshot() { return displayNameSnapshot; }
    public BakeryMemberRole getMemberRole() { return memberRole; }
    public BakeryMemberStatus getStatus() { return status; }
    public Instant getJoinedAt() { return joinedAt; }

    public void setBakery(Bakery value) { this.bakery = value; }
    public void setUserId(UUID value) { this.userId = value; }
    public void setMemberRole(BakeryMemberRole value) { this.memberRole = value; }
    public void setStatus(BakeryMemberStatus value) { this.status = value; }
    public void setDisplayNameSnapshot(String value) { this.displayNameSnapshot = value; }
    public void setOwnerActivationPending(boolean value) { this.ownerActivationPending = value; }
}
