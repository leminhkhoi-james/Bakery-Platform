package com.se193262.bakeryservice.feature.member.repository;

import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BakeryMemberRepository extends JpaRepository<BakeryMember, UUID> {

    List<BakeryMember> findAllByBakery_IdOrderByJoinedAtAsc(UUID bakeryId);

    Optional<BakeryMember> findByBakery_IdAndUserId(UUID bakeryId, UUID userId);

    Optional<BakeryMember> findFirstByUserIdAndStatusOrderByJoinedAtAscIdAsc(
            UUID userId, BakeryMemberStatus status);

    @Query(value = """
            SELECT pg_try_advisory_xact_lock(hashtextextended('bakery-onboarding:' || CAST(:userId AS text), 0))
            """, nativeQuery = true)
    boolean tryLockOnboarding(@Param("userId") UUID userId);

    @Query("""
            select member from BakeryMember member
            where member.bakery.id = :bakeryId and member.ownerActivationPending = true
            and member.bakery.status = :bakeryStatus and member.status = :memberStatus
            """)
    List<BakeryMember> findPendingActivations(@Param("bakeryId") UUID bakeryId,
            @Param("bakeryStatus") BakeryStatus bakeryStatus, @Param("memberStatus") BakeryMemberStatus memberStatus);

    @Query("""
            select distinct member.bakery.id from BakeryMember member
            where member.ownerActivationPending = true and member.status = :memberStatus
            and member.bakery.status = :bakeryStatus order by member.bakery.id
            """)
    Slice<UUID> findPendingActivationBakeryIds(@Param("bakeryStatus") BakeryStatus bakeryStatus,
            @Param("memberStatus") BakeryMemberStatus memberStatus, Pageable pageable);

    @Modifying
    @Transactional
    @Query("update BakeryMember member set member.ownerActivationPending = false where member.id = :memberId")
    void markOwnerActivationComplete(@Param("memberId") UUID memberId);
}
