package com.se193262.bakeryservice.feature.catalog;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.catalog.dto.CatalogContracts.QuoteRequest;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import com.se193262.platform.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CatalogServiceImplTest {
    private final CatalogRepository repository = mock(CatalogRepository.class);
    private final SubscriptionEntitlementClient entitlementClient = mock(SubscriptionEntitlementClient.class);
    private final CatalogService service = new CatalogServiceImpl(repository, entitlementClient);
    private final UUID bakeryId = UUID.randomUUID();
    private final QuoteRequest request = new QuoteRequest(bakeryId, null, "HCM", "D1", List.of(), List.of());

    @BeforeEach
    void activeBakery() {
        when(repository.one(anyString(), anyMap()))
                .thenReturn(Map.of("id", bakeryId, "name", "Bakery", "status", "ACTIVE"));
        when(repository.list(anyString(), anyMap())).thenReturn(List.of(Map.of(
                "city", "HCM", "district", "D1", "delivery_fee", BigDecimal.ZERO,
                "minimum_order", BigDecimal.ZERO)));
    }

    @Test
    @DisplayName("Marketplace quotes cannot bypass expired subscription checks")
    void quote_inactiveSubscription_rejectsBothContracts() {
        for (boolean productRequired : new boolean[] {true, false}) {
            assertThatThrownBy(() -> service.quote(request, productRequired))
                    .isInstanceOfSatisfying(BusinessException.class, exception ->
                            assertThat(exception.status()).isEqualTo(409));
        }
    }

    @Test
    @DisplayName("Unavailable Subscription fails closed for Marketplace quotes")
    void quote_subscriptionUnavailable_returns503() {
        when(entitlementClient.hasActiveSubscription(bakeryId))
                .thenThrow(new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Unavailable"));
        assertThatThrownBy(() -> service.quote(request, false))
                .isInstanceOfSatisfying(AppException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    @DisplayName("Active subscription permits an add-on quote")
    void quote_activeSubscription_returnsSnapshot() {
        when(entitlementClient.hasActiveSubscription(bakeryId)).thenReturn(true);
        assertThat(service.quote(request, false).addOnTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
