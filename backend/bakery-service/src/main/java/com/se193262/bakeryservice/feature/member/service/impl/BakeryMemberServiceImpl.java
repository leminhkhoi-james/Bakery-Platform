package com.se193262.bakeryservice.feature.member.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import com.se193262.bakeryservice.feature.member.service.BakeryMemberService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BakeryMemberServiceImpl implements BakeryMemberService {
    private final BakeryMemberRepository memberRepository;
    private final BakeryRepository bakeryRepository;

    public BakeryMemberServiceImpl(BakeryMemberRepository memberRepository,
                                   BakeryRepository bakeryRepository) {
        this.memberRepository = memberRepository;
        this.bakeryRepository = bakeryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BakeryMemberDto> list(UUID bakeryId) {
        if (!bakeryRepository.existsById(bakeryId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bakery not found");
        }
        return memberRepository.findAllByBakery_IdOrderByJoinedAtAsc(bakeryId)
                .stream().map(BakeryMemberDto::fromEntity).toList();
    }
}
