package com.se193262.bakeryservice.feature.bakery.service;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryInternalProfileResponse;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryAddressRepository;
import com.se193262.bakeryservice.feature.bakery.repository.ServiceAreaRepository;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.feature.member.dto.BakeryAuthorizationResponse;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class BakeryInternalService {
    private final BakeryRepository bakeryRepository;
    private final BakeryMemberRepository memberRepository;
    private final BakeryAddressRepository addressRepository;
    private final ServiceAreaRepository areaRepository;

    public BakeryInternalService(BakeryRepository bakeryRepository,
            BakeryMemberRepository memberRepository, BakeryAddressRepository addressRepository,
            ServiceAreaRepository areaRepository) {
        this.bakeryRepository = bakeryRepository;
        this.memberRepository = memberRepository;
        this.addressRepository = addressRepository;
        this.areaRepository = areaRepository;
    }

    @Transactional(readOnly = true)
    public BakeryInternalProfileResponse profile(UUID bakeryId) {
        var bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
        var primaryAddress = addressRepository.findAllByBakery_Id(bakeryId).stream()
                .filter(address -> address.isPrimary()).findFirst()
                .map(address -> new BakeryInternalProfileResponse.Address(
                        address.getDistrict(), address.getCity())).orElse(null);
        var areas = areaRepository.findAllByBakery_Id(bakeryId).stream()
                .map(area -> new BakeryInternalProfileResponse.Area(area.getDistrict(),
                        area.getCity(), area.getDeliveryFee(), area.isActive())).toList();
        return new BakeryInternalProfileResponse(bakeryId, bakery.getName(), bakery.getStatus(),
                primaryAddress, areas);
    }

    @Transactional(readOnly = true)
    public BakeryAuthorizationResponse authorization(UUID bakeryId, UUID userId,
            BakeryMemberRole requiredRole) {
        if (!bakeryRepository.existsById(bakeryId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bakery not found");
        }
        return memberRepository.findByBakery_IdAndUserId(bakeryId, userId)
                .map(member -> {
                    boolean active = member.getStatus() == BakeryMemberStatus.ACTIVE;
                    boolean authorized = active && (requiredRole == null
                            || roleRank(member.getMemberRole()) >= roleRank(requiredRole));
                    return new BakeryAuthorizationResponse(bakeryId, userId, active,
                            member.getMemberRole(), authorized);
                })
                .orElse(new BakeryAuthorizationResponse(bakeryId, userId, false, null, false));
    }

    private int roleRank(BakeryMemberRole role) {
        return switch (role) {
            case OWNER -> 3;
            case MANAGER -> 2;
            case STAFF -> 1;
        };
    }
}
