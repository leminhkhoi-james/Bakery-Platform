package com.se193262.marketplaceservice.infrastructure.client;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.config.RemoteProperties;
import com.se193262.platform.exception.BusinessException;

import org.junit.jupiter.api.*;

import java.time.*;
import java.util.*;

class SubscriptionClientTest {
    final ServiceHttpClient http = mock(ServiceHttpClient.class);
    final Clock clock = mock(Clock.class);
    final UUID bakery = UUID.randomUUID();
    final Instant now = Instant.now();
    final SubscriptionClient client = new SubscriptionClient(http, clock);

    @BeforeEach
    void setup() {
        var properties = mock(RemoteProperties.class);
        when(properties.subscriptionUrl()).thenReturn("http://subscription");
        when(http.properties()).thenReturn(properties);
        when(clock.instant()).thenReturn(now);
    }

    @Test
    @DisplayName("An entitlement cache never outlives its subscription period")
    void active_periodExpires_refreshesEntitlement() {
        when(http.get(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        eq(SubscriptionClient.Entitlement.class)))
                .thenReturn(new SubscriptionClient.Entitlement(bakery, true, now.plusSeconds(20)))
                .thenReturn(new SubscriptionClient.Entitlement(bakery, false, null));
        assertTrue(client.active(bakery));
        when(clock.instant()).thenReturn(now.plusSeconds(21));
        assertFalse(client.active(bakery));
        verify(http, times(2))
                .get(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        eq(SubscriptionClient.Entitlement.class));
    }

    @Test
    @DisplayName("An expired cache cannot hide a required dependency outage")
    void active_expiredCacheAndOutage_failsClosed() {
        when(http.get(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        eq(SubscriptionClient.Entitlement.class)))
                .thenReturn(new SubscriptionClient.Entitlement(bakery, true, now.plusSeconds(600)))
                .thenThrow(BusinessException.unavailable());
        assertTrue(client.active(bakery));
        when(clock.instant()).thenReturn(now.plusSeconds(61));
        assertEquals(
                503, assertThrows(BusinessException.class, () -> client.active(bakery)).status());
    }
}
