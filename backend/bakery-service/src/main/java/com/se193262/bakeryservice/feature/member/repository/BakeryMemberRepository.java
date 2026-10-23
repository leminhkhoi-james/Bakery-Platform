package com.se193262.bakeryservice.feature.member.repository;

import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BakeryMemberRepository extends JpaRepository<BakeryMember, UUID> {

    List<BakeryMember> findAllByBakery_IdOrderByJoinedAtAsc(UUID bakeryId);

    Optional<BakeryMember> findByIdAndBakery_Id(UUID memberId, UUID bakeryId);

    Optional<BakeryMember> findByBakery_IdAndUserId(UUID bakeryId, UUID userId);

    boolean existsByBakery_IdAndUserId(UUID bakeryId, UUID userId);

    long countByBakery_IdAndMemberRoleAndStatus(UUID bakeryId,
            BakeryMemberRole role, BakeryMemberStatus status);
}
