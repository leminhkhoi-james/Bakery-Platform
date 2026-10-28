package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.offer.OfferAcceptanceWorkflowRepository;
import com.se193262.marketplaceservice.infrastructure.client.BakeryClient;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.Membership;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketplaceOwnerAuthorizationTest {
    @Mock BakeryClient bakery;
    @Mock OfferAcceptanceWorkflowRepository workflows;
    private final UUID bakeryId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("Legacy staff platform role cannot access bakery requests")
    void bakeryMember_withLegacyStaffRole_isForbidden() {
        var access = new MarketplaceAccess(bakery, workflows);
        assertThrows(BusinessException.class, () -> access.bakeryMember(
                bakeryId, new Actor(userId, Set.of("ROLE_BAKERY_STAFF")), false));
        verifyNoInteractions(bakery);
    }

    @Test
    @DisplayName("Owner JWT cannot authorize legacy manager membership for reads or writes")
    void bakeryMember_withLegacyManagerMembership_isForbidden() {
        var access = new MarketplaceAccess(bakery, workflows);
        when(bakery.membership(bakeryId, userId))
                .thenReturn(new Membership(bakeryId, userId, true, "MANAGER", true));
        var actor = new Actor(userId, Set.of("ROLE_BAKERY_OWNER"));
        assertThrows(BusinessException.class, () -> access.bakeryMember(bakeryId, actor, false));
        assertThrows(BusinessException.class, () -> access.bakeryMember(bakeryId, actor, true));
    }

    @Test
    @DisplayName("Active owner can manage bakery requests")
    void bakeryMember_withActiveOwner_isAllowed() {
        var access = new MarketplaceAccess(bakery, workflows);
        when(bakery.membership(bakeryId, userId))
                .thenReturn(new Membership(bakeryId, userId, true, "OWNER", true));
        assertDoesNotThrow(() -> access.bakeryMember(
                bakeryId, new Actor(userId, Set.of("ROLE_BAKERY_OWNER")), true));
    }
}
