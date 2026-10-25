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
import com.se193262.bakeryservice.infrastructure.client.IdentityUserClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BakeryMemberServiceImpl implements BakeryMemberService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BakeryMemberServiceImpl.class);

    private final BakeryMemberRepository memberRepository;
    private final BakeryRepository bakeryRepository;
    private final IdentityUserClient identityUserClient;

    public BakeryMemberServiceImpl(BakeryMemberRepository memberRepository,
                                   BakeryRepository bakeryRepository,
                                   IdentityUserClient identityUserClient) {
        this.memberRepository = memberRepository;
        this.bakeryRepository = bakeryRepository;
        this.identityUserClient = identityUserClient;
    }

    @Override
    @Transactional
    public List<BakeryMemberDto> list(UUID bakeryId) {
        findBakery(bakeryId);
        return memberRepository.findAllByBakery_IdOrderByJoinedAtAsc(bakeryId)
                .stream().map(member -> {
                    if (member.getDisplayNameSnapshot() == null) {
                        try {
                            member.captureDisplayName(identityUserClient.getUser(member.getUserId()).displayName());
                        } catch (AppException exception) {
                            // Existing memberships stay readable while Identity is unavailable.
                            log.warn("Member display snapshot unavailable: memberId={}, status={}",
                                    member.getId(), exception.getStatus().value());
                        }
                    }
                    return BakeryMemberDto.fromEntity(member);
                }).toList();
    }

    @Override
    @Transactional
    public BakeryMemberDto create(UUID bakeryId, BakeryMemberDto request) {
        if (request == null || request.id() != null || request.status() != null
                || request.joinedAt() != null || request.displayNameSnapshot() != null
                || request.userId() == null || request.memberRole() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "userId and memberRole are required; server fields are read-only");
        }
        if (request.memberRole() == BakeryMemberRole.OWNER) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "OWNER is assigned when the bakery is created");
        }
        Bakery bakery = findBakery(bakeryId);
        if (memberRepository.existsByBakery_IdAndUserId(bakeryId, request.userId())) {
            throw new AppException(HttpStatus.CONFLICT, "User is already a bakery member");
        }
        var profile = identityUserClient.requireEligibleMember(request.userId());
        BakeryMember member = new BakeryMember(bakery, request.userId(), request.memberRole(), profile.displayName());
        return BakeryMemberDto.fromEntity(memberRepository.saveAndFlush(member));
    }

    @Override
    @Transactional
    public BakeryMemberDto createAs(UUID bakeryId, UUID actorUserId, BakeryMemberDto request) {
        BakeryMember actor = findActiveActor(bakeryId, actorUserId);
        if (actor.getMemberRole() == BakeryMemberRole.STAFF
                || actor.getMemberRole() == BakeryMemberRole.MANAGER
                && (request == null || request.memberRole() != BakeryMemberRole.STAFF)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Only an owner can add a manager");
        }
        return create(bakeryId, request);
    }

    @Override
    @Transactional
    public BakeryMemberDto update(UUID bakeryId, UUID memberId, BakeryMemberDto request) {
        if (request == null || request.id() != null || request.joinedAt() != null
                || request.userId() != null || request.displayNameSnapshot() != null) {
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
    public BakeryMemberDto updateAs(UUID bakeryId, UUID actorUserId, UUID memberId,
            BakeryMemberDto request) {
        BakeryMember actor = findActiveActor(bakeryId, actorUserId);
        BakeryMember target = findMember(bakeryId, memberId);
        if (actor.getMemberRole() == BakeryMemberRole.STAFF
                || actor.getMemberRole() == BakeryMemberRole.MANAGER
                && (target.getMemberRole() != BakeryMemberRole.STAFF
                || request != null && request.memberRole() != null
                && request.memberRole() != BakeryMemberRole.STAFF)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Manager may only update staff members");
        }
        return update(bakeryId, memberId, request);
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

    @Override
    @Transactional
    public void deleteAs(UUID bakeryId, UUID actorUserId, UUID memberId) {
        BakeryMember actor = findActiveActor(bakeryId, actorUserId);
        BakeryMember target = findMember(bakeryId, memberId);
        if (actor.getMemberRole() == BakeryMemberRole.STAFF
                || actor.getMemberRole() == BakeryMemberRole.MANAGER
                && target.getMemberRole() != BakeryMemberRole.STAFF) {
            throw new AppException(HttpStatus.FORBIDDEN, "Manager may only remove staff members");
        }
        delete(bakeryId, memberId);
    }

    private BakeryMember findActiveActor(UUID bakeryId, UUID actorUserId) {
        return memberRepository.findByBakery_IdAndUserId(bakeryId, actorUserId)
                .filter(member -> member.getStatus() == BakeryMemberStatus.ACTIVE)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Active bakery membership is required"));
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
