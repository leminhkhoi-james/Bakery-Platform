package com.se193262.bakeryservice.feature.bakery.dto;

import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import java.time.Instant;
import java.util.Map;
import java.util.List;

public record AdminBakeryDetailResponse(BakeryDto bakery,
        List<BakeryMemberDto> members,
        SubscriptionSummary subscription) {
    public record SubscriptionSummary(boolean active, String planCode,
            Instant periodEnd, Map<String, String> features) { }
}
