package com.se193262.bakeryservice.feature.member.dto;

import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import java.util.UUID;

public record BakeryAuthorizationResponse(UUID bakeryId, UUID userId, boolean active,
        BakeryMemberRole memberRole, boolean authorized) {
}
