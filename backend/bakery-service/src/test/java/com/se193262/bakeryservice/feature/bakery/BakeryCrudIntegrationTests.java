package com.se193262.bakeryservice.feature.bakery;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOperationsDto;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.service.BakeryService;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import com.se193262.bakeryservice.feature.member.service.BakeryMemberService;
import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.infrastructure.client.IdentityUserClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.se193262.bakeryservice.PostgresIntegrationTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@Transactional
class BakeryCrudIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private BakeryService bakeryService;

    @Autowired
    private BakeryMemberRepository memberRepository;
    @Autowired private BakeryMemberService memberService;
    @Autowired private BakeryRepository bakeryRepository;

    @Test
    void createsBakeryWithOwnerAndReplacesOperations() {
        UUID ownerId = UUID.randomUUID();
        BakeryDto created = bakeryService.create(new BakeryDto(null, "Test Bakery", "Fresh cakes",
                "+84901112223", "test@example.com", null, null), ownerId);

        assertThat(created.id()).isNotNull();
        assertThat(created.status()).isEqualTo(BakeryStatus.DRAFT);
        assertThat(memberRepository.findAll()).anySatisfy(member -> {
            assertThat(member.getBakery().getId()).isEqualTo(created.id());
            assertThat(member.getUserId()).isEqualTo(ownerId);
            assertThat(member.getMemberRole()).isEqualTo(BakeryMemberRole.OWNER);
        });

        BakeryOperationsDto operations = bakeryService.replaceOperations(created.id(),
                new BakeryOperationsDto(
                        List.of(new BakeryOperationsDto.Address(null, "12 Le Loi", "Ben Nghe",
                                "District 1", "Ho Chi Minh City", null, null, true)),
                        List.of(new BakeryOperationsDto.ServiceArea(null, "Ho Chi Minh City",
                                "District 1", BigDecimal.valueOf(30000), BigDecimal.valueOf(200000), true)),
                        List.of(new BakeryOperationsDto.BusinessHour((short) 1,
                                LocalTime.of(8, 0), LocalTime.of(20, 0), false))));

        assertThat(operations.addresses()).hasSize(1);
        assertThat(operations.serviceAreas()).hasSize(1);
        assertThat(operations.businessHours()).hasSize(1);
        UUID addressId = operations.addresses().getFirst().id();
        UUID areaId = operations.serviceAreas().getFirst().id();
        assertThat(addressId).isNotNull();
        assertThat(areaId).isNotNull();

        BakeryOperationsDto replaced = bakeryService.replaceOperations(created.id(),
                new BakeryOperationsDto(
                        List.of(new BakeryOperationsDto.Address(addressId, "14 Le Loi", null,
                                "District 1", "Ho Chi Minh City", null, null, true)),
                        List.of(new BakeryOperationsDto.ServiceArea(areaId, "Ho Chi Minh City",
                                "District 1", BigDecimal.ZERO, BigDecimal.ZERO, true)),
                        List.of(new BakeryOperationsDto.BusinessHour((short) 1,
                                LocalTime.of(9, 0), LocalTime.of(18, 0), false))));

        assertThat(replaced.addresses().getFirst().id()).isEqualTo(addressId);
        assertThat(replaced.addresses().getFirst().addressLine()).isEqualTo("14 Le Loi");
        assertThat(replaced.serviceAreas().getFirst().id()).isEqualTo(areaId);
        assertThat(replaced.serviceAreas().getFirst().deliveryFee()).isEqualByComparingTo("0");
        assertThat(replaced.businessHours().getFirst().opensAt()).isEqualTo(LocalTime.of(9, 0));

        BakeryDto updated = bakeryService.update(created.id(), new BakeryDto(null, "Renamed Bakery",
                null, null, null, null, null));
        assertThat(updated.name()).isEqualTo("Renamed Bakery");
        assertThat(bakeryService.get(created.id()).operations().addresses()).hasSize(1);

        BakeryOperationsDto cleared = bakeryService.replaceOperations(created.id(),
                new BakeryOperationsDto(List.of(), List.of(), List.of()));
        assertThat(cleared.addresses()).isEmpty();
        assertThat(cleared.serviceAreas()).isEmpty();
        assertThat(cleared.businessHours()).isEmpty();
    }

    @Test
    @DisplayName("Owner/member names are captured from Identity and remain stable after profile edits")
    void members_identityProfileChanges_preserveSnapshots() {
        UUID ownerId = UUID.randomUUID();
        UUID staffId = UUID.randomUUID();
        UUID bakeryId = bakeryService.create(new BakeryDto(null, "Snapshots", null,
                "0900000000", null, null, null), ownerId).id();
        when(identityUserClient.requireEligibleMember(staffId)).thenReturn(new IdentityUserClient.UserProfile(
                staffId, "Original staff name", "ACTIVE", List.of("BAKERY_STAFF")));
        var member = memberService.createAs(bakeryId, ownerId,
                new BakeryMemberDto(null, staffId, BakeryMemberRole.STAFF, null, null));
        assertThat(member.displayNameSnapshot()).isEqualTo("Original staff name");
        when(identityUserClient.getUser(staffId)).thenReturn(new IdentityUserClient.UserProfile(
                staffId, "Changed name", "ACTIVE", List.of("BAKERY_STAFF")));
        var members = memberService.list(bakeryId);
        assertThat(members).filteredOn(item -> item.userId().equals(ownerId))
                .extracting(BakeryMemberDto::displayNameSnapshot).containsExactly("Test member");
        assertThat(members).filteredOn(item -> item.userId().equals(staffId))
                .extracting(BakeryMemberDto::displayNameSnapshot).containsExactly("Original staff name");
        verify(identityUserClient, never()).getUser(staffId);
    }

    @Test
    @DisplayName("Legacy memberships obtain a snapshot without losing readability during Identity outages")
    void members_missingSnapshot_backfillsOrReturnsNull() {
        UUID ownerId = UUID.randomUUID();
        UUID bakeryId = bakeryService.create(new BakeryDto(null, "Legacy", null,
                "0900000000", null, null, null), ownerId).id();
        UUID legacyId = UUID.randomUUID();
        var legacy = memberRepository.saveAndFlush(new BakeryMember(bakeryRepository.findById(bakeryId)
                .orElseThrow(), legacyId, BakeryMemberRole.STAFF));
        memberService.list(bakeryId);
        assertThat(legacy.getDisplayNameSnapshot()).isEqualTo("Test member");
        UUID unavailableId = UUID.randomUUID();
        memberRepository.saveAndFlush(new BakeryMember(bakeryRepository.findById(bakeryId)
                .orElseThrow(), unavailableId, BakeryMemberRole.STAFF));
        when(identityUserClient.getUser(unavailableId)).thenThrow(new com.se193262.bakeryservice.exception.AppException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Unavailable"));
        assertThat(memberService.list(bakeryId)).filteredOn(item -> item.userId().equals(unavailableId))
                .extracting(BakeryMemberDto::displayNameSnapshot).containsExactly((String) null);
    }
}
