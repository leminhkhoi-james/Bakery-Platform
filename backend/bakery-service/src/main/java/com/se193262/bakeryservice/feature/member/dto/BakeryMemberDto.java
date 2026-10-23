package com.se193262.bakeryservice.feature.member.dto;

import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;

import java.time.Instant;
import java.util.UUID;

public record BakeryMemberDto(
        UUID id,
        UUID userId,
        BakeryMemberRole memberRole,
        BakeryMemberStatus status,
        Instant joinedAt
) {
    public static BakeryMemberDto fromEntity(BakeryMember member) {
        return new BakeryMemberDto(member.getId(), member.getUserId(), member.getMemberRole(),
                member.getStatus(), member.getJoinedAt());
    }
}
