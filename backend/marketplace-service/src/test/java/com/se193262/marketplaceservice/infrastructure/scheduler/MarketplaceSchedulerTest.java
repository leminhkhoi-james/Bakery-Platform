package com.se193262.marketplaceservice.infrastructure.scheduler;

import com.se193262.marketplaceservice.feature.cakerequest.CakeRequestRepository;
import com.se193262.marketplaceservice.feature.cakerequest.RequestImageService;
import com.se193262.marketplaceservice.feature.offer.MarketplaceExpirationService;
import com.se193262.marketplaceservice.feature.offer.OfferAcceptanceService;
import com.se193262.marketplaceservice.feature.offer.OfferRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;

import static org.mockito.Mockito.*;

class MarketplaceSchedulerTest {
    @Test
    @DisplayName("Explicit sandbox mode never scans or deletes unrelated orphan objects")
    void clean_disabled_skipsStorageCleanup() {
        RequestImageService images = mock(RequestImageService.class);
        scheduler(images, false).clean();
        verifyNoInteractions(images);
    }

    @Test
    @DisplayName("Default enabled cleanup preserves the existing production behavior")
    void clean_enabled_invokesExistingCleanup() {
        RequestImageService images = mock(RequestImageService.class);
        scheduler(images, true).clean();
        verify(images).cleanOrphans();
    }

    private MarketplaceScheduler scheduler(RequestImageService images, boolean enabled) {
        return new MarketplaceScheduler(mock(OfferAcceptanceService.class),
                mock(MarketplaceExpirationService.class), mock(OfferRepository.class),
                mock(CakeRequestRepository.class), images, Clock.systemUTC(), enabled);
    }
}
