package com.se193262.bakeryservice.feature.member.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
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
        findBakery(bakeryId);
        return memberRepository.findAllByBakery_IdOrderByJoinedAtAsc(bakeryId)
                .stream().map(BakeryMemberDto::fromEntity).toList();
    }

    @Override
    @Transactional
    public BakeryMemberDto create(UUID bakeryId, BakeryMemberDto request) {
        if (request == null || request.id() != null || request.status() != null
                || request.joinedAt() != null || request.userId() == null || request.memberRole() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "userId and memberRole are required; server fields are read-only");
        }
        if (request.memberRole() == BakeryMemberRole.OWNER) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "OWNER is assigned when the bakery is created");
        }
        Bakery bakery = findBakery(bakeryId);
        if (memberRepository.existsByBakery_IdAndUserId(bakeryId, request.userId())) {
            throw new AppException(HttpStatus.CONFLICT, "User is already a bakery member");
        }
        BakeryMember member = new BakeryMember(bakery, request.userId(), request.memberRole());
        return BakeryMemberDto.fromEntity(memberRepository.saveAndFlush(member));
    }

    @Override
    @Transactional
    public BakeryMemberDto update(UUID bakeryId, UUID memberId, BakeryMemberDto request) {
        if (request == null || request.id() != null || request.joinedAt() != null
                || request.userId() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "id, userId and joinedAt are read-only");
        }
        BakeryMember member = findMember(bakeryId, memberId);
        if (request.memberRole() == BakeryMemberRole.OWNER
                && member.getMemberRole() != BakeryMemberRole.OWNER) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "OWNER cannot be assigned through member update");
        }
        if (member.getMemberRole() == BakeryMemberRole.OWNER
                && ((request.memberRole() != null && request.memberRole() != BakeryMemberRole.OWNER)
                || (request.status() != null && request.status() != BakeryMemberStatus.ACTIVE))) {
            ensureAnotherActiveOwner(bakeryId);
        }
        member.update(request.memberRole(), request.status());
        memberRepository.flush();
        return BakeryMemberDto.fromEntity(member);
    }

    @Override
    @Transactional
    public void delete(UUID bakeryId, UUID memberId) {
        BakeryMember member = findMember(bakeryId, memberId);
        if (member.getMemberRole() == BakeryMemberRole.OWNER
                && member.getStatus() == BakeryMemberStatus.ACTIVE) {
            ensureAnotherActiveOwner(bakeryId);
        }
        memberRepository.delete(member);
        memberRepository.flush();
    }

    private void ensureAnotherActiveOwner(UUID bakeryId) {
        if (memberRepository.countByBakery_IdAndMemberRoleAndStatus(
                bakeryId, BakeryMemberRole.OWNER, BakeryMemberStatus.ACTIVE) <= 1) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "The last active OWNER cannot be removed");
        }
    }

    private BakeryMember findMember(UUID bakeryId, UUID memberId) {
        return memberRepository.findByIdAndBakery_Id(memberId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Member not found"));
    }

    private Bakery findBakery(UUID bakeryId) {
        return bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
    }
}
