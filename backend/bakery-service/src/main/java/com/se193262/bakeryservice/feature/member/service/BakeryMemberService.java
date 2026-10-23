package com.se193262.bakeryservice.feature.member.service;

import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;

import java.util.List;
import java.util.UUID;

public interface BakeryMemberService {

    List<BakeryMemberDto> list(UUID bakeryId);

    BakeryMemberDto create(UUID bakeryId, BakeryMemberDto request);

    BakeryMemberDto createAs(UUID bakeryId, UUID actorUserId, BakeryMemberDto request);

    BakeryMemberDto update(UUID bakeryId, UUID memberId, BakeryMemberDto request);

    BakeryMemberDto updateAs(UUID bakeryId, UUID actorUserId, UUID memberId,
            BakeryMemberDto request);

    void delete(UUID bakeryId, UUID memberId);

    void deleteAs(UUID bakeryId, UUID actorUserId, UUID memberId);
}
