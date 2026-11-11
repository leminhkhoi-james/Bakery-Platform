package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.offer.OfferRepository;
import com.se193262.marketplaceservice.feature.offer.OfferServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class MarketplaceFilterValidationTest {
    @BeforeEach
    void authenticateAdmin() {
        var jwt = Jwt.withTokenValue("unit-test").header("alg", "RS256")
                .subject(UUID.randomUUID().toString()).claim("token_type", "user").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    @AfterEach void clearAuthentication() { SecurityContextHolder.clearContext(); }

    @Test
    void invalidRequestFilters_failBeforeRepositoryExceptionTranslation() {
        var requests = mock(CakeRequestRepository.class);
        var access = mock(MarketplaceAccess.class);
        when(access.visible(any(), eq(null))).thenReturn((root,q,b) -> b.conjunction());
        var service = new CakeRequestServiceImpl(requests, null, access, null, null,
                null, null, null, null, null, null, null);
        for (var filter : List.of(Map.of("status", "INVALID"), Map.of("requestType", "INVALID"))) {
            assertThatThrownBy(() -> service.list(filter)).isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> service.list(Map.of("neededFrom", "invalid")))
                .isInstanceOf(java.time.format.DateTimeParseException.class);
        verifyNoInteractions(requests);
    }

    @Test
    void invalidOfferFilters_failBeforeRepositoryExceptionTranslation() {
        var offers = mock(OfferRepository.class);
        var service = new OfferServiceImpl(offers, null, null, null, null, null, null, null, null);
        for (var filter : List.of(Map.of("status", "INVALID"), Map.of("bakeryId", "invalid"),
                Map.of("cakeRequestId", "invalid"))) {
            assertThatThrownBy(() -> service.list(filter)).isInstanceOf(IllegalArgumentException.class);
        }
        verifyNoInteractions(offers);
    }
}
