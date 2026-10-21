package com.se193262.bakeryservice.feature.member.entity;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bakery_members")
public class BakeryMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    // Identity Service owns the user; this service stores only its ID.
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 30)
    private BakeryMemberRole memberRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private BakeryMemberStatus status = BakeryMemberStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    protected BakeryMember() {
    }

    public BakeryMember(Bakery bakery, UUID userId, BakeryMemberRole memberRole) {
        this.bakery = bakery;
        this.userId = userId;
        this.memberRole = memberRole;
    }

    public void update(BakeryMemberRole role, BakeryMemberStatus status) {
        if (role != null) this.memberRole = role;
        if (status != null) this.status = status;
    }

    public UUID getId() { return id; }
    public Bakery getBakery() { return bakery; }
    public UUID getUserId() { return userId; }
    public BakeryMemberRole getMemberRole() { return memberRole; }
    public BakeryMemberStatus getStatus() { return status; }
    public Instant getJoinedAt() { return joinedAt; }
}
