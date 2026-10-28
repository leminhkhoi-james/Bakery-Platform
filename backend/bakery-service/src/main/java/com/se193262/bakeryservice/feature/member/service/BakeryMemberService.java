package com.se193262.bakeryservice.feature.member.service;

import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;

import java.util.List;
import java.util.UUID;

public interface BakeryMemberService {

    List<BakeryMemberDto> list(UUID bakeryId);

}
