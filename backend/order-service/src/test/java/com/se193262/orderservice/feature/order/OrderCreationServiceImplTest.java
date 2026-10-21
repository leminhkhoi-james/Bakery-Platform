package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.CreateDirectOrderRequest;
import com.se193262.orderservice.feature.order.dto.CreateOfferOrderRequest;
import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.BakeryServiceClient;
import com.se193262.orderservice.infrastructure.client.IdentityClient;
import com.se193262.orderservice.infrastructure.client.IdentityServiceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderCreationServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-10-19T12:00:00Z");
    private static final UUID CUSTOMER_ID = UUID.fromString("4ccca4ab-50a8-4d37-9a25-d95450f7b77f");
    private static final UUID BAKERY_ID = UUID.fromString("f22b255f-cdd7-4f1e-946d-4f1309c70e34");
    private static final UUID ADDRESS_ID = UUID.fromString("20ee2daf-d4cd-475f-a478-a0e16d78fb7c");
    private static final UUID PRODUCT_ID = UUID.fromString("ebca6e49-e829-4751-a123-d4db2af91da0");
    private static final UUID OFFER_ID = UUID.fromString("4be46cc4-470f-40cf-a53d-dd59744a81e9");
    private static final UUID REQUEST_ID = UUID.fromString("af2c72e8-5571-4c14-8481-4440cfdad5aa");
    private static final UUID IDEMPOTENCY_KEY = UUID.fromString("945d4534-644e-4b56-a667-0bed432d8b8a");

    @Mock
    private OrderPersistenceService persistenceService;
    @Mock
    private IdentityServiceClient identityClient;
    @Mock
    private BakeryServiceClient bakeryClient;
    @Mock
    private MarketplaceServiceClient marketplaceClient;

    private OrderCreationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OrderCreationServiceImpl(
                persistenceService, identityClient, bakeryClient, marketplaceClient,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void createDirectOrderPersistsAuthoritativeQuoteAndAddressSnapshots() {
        CreateDirectOrderRequest request = new CreateDirectOrderRequest(
                BAKERY_ID, PRODUCT_ID, 1, List.of(), List.of(), ADDRESS_ID,
                NOW.plusSeconds(7200), "Birthday note");
        IdentityClient.UserResponse customer = activeCustomer();
        IdentityClient.AddressResponse address = address();
        BakeryClient.CatalogQuoteResponse quote = quote();
        when(persistenceService.findReplay(eq("DIRECT_CATALOG"), eq(CUSTOMER_ID), eq(IDEMPOTENCY_KEY), any()))
                .thenReturn(Optional.empty());
        when(identityClient.getUser(CUSTOMER_ID)).thenReturn(customer);
        when(identityClient.getAddress(CUSTOMER_ID, ADDRESS_ID)).thenReturn(address);
        when(bakeryClient.getCatalogQuote(any())).thenReturn(quote);
        when(persistenceService.saveNew(any(), eq("DIRECT_CATALOG"), eq(CUSTOMER_ID),
                eq(IDEMPOTENCY_KEY), any(), eq(NOW))).thenReturn(new OrderCreationResult(null, false));

        OrderCreationResult result = service.createDirectOrder(CUSTOMER_ID, IDEMPOTENCY_KEY, request);

        assertFalse(result.replayed());
        ArgumentCaptor<CustomerOrder> orderCaptor = ArgumentCaptor.forClass(CustomerOrder.class);
        verify(persistenceService).saveNew(orderCaptor.capture(), eq("DIRECT_CATALOG"), eq(CUSTOMER_ID),
                eq(IDEMPOTENCY_KEY), any(), eq(NOW));
        CustomerOrder order = orderCaptor.getValue();
        assertEquals(OrderSource.DIRECT_CATALOG, order.getOrderSource());
        assertEquals(CUSTOMER_ID, order.getCustomerId());
        assertEquals(BAKERY_ID, order.getBakeryId());
        assertEquals("Alice Customer", order.getCustomerNameSnapshot());
        assertEquals("Birthday note", order.getCustomerNote());
        assertEquals(new BigDecimal("120.00"), order.getTotalAmount());
        assertEquals(1, order.getItems().size());
        assertEquals(PRODUCT_ID, order.getItems().getFirst().getSourceProductId());
        assertEquals("District 1", order.getDeliveryAddressSnapshot().getDistrict());
        assertEquals(1, order.getStatusHistory().size());
    }

    @Test
    void createFromAcceptedOfferPersistsMarketplaceSnapshots() {
        CreateOfferOrderRequest request = new CreateOfferOrderRequest(
                OFFER_ID, REQUEST_ID, CUSTOMER_ID, ADDRESS_ID, "Call on arrival");
        MarketplaceClient.AcceptedOfferOrderSourceResponse offer = offerSnapshot();
        when(persistenceService.findReplay(eq("ACCEPTED_OFFER"), eq(CUSTOMER_ID), eq(IDEMPOTENCY_KEY), any()))
                .thenReturn(Optional.empty());
        when(marketplaceClient.getAcceptedOfferOrderSource(OFFER_ID)).thenReturn(offer);
        when(persistenceService.offerAlreadyHasOrder(OFFER_ID)).thenReturn(false);
        when(identityClient.getUser(CUSTOMER_ID)).thenReturn(activeCustomer());
        when(identityClient.getAddress(CUSTOMER_ID, ADDRESS_ID)).thenReturn(address());
        when(persistenceService.saveNew(any(), eq("ACCEPTED_OFFER"), eq(CUSTOMER_ID),
                eq(IDEMPOTENCY_KEY), any(), eq(NOW))).thenReturn(new OrderCreationResult(null, false));

        OrderCreationResult result = service.createFromAcceptedOffer(IDEMPOTENCY_KEY, request);

        assertFalse(result.replayed());
        ArgumentCaptor<CustomerOrder> orderCaptor = ArgumentCaptor.forClass(CustomerOrder.class);
        verify(persistenceService).saveNew(orderCaptor.capture(), eq("ACCEPTED_OFFER"), eq(CUSTOMER_ID),
                eq(IDEMPOTENCY_KEY), any(), eq(NOW));
        CustomerOrder order = orderCaptor.getValue();
        assertEquals(OrderSource.ACCEPTED_OFFER, order.getOrderSource());
        assertEquals(OFFER_ID, order.getOfferId());
        assertEquals(REQUEST_ID, order.getCakeRequestId());
        assertEquals("Offer-time Alice", order.getCustomerNameSnapshot());
        assertEquals("+84901111111", order.getCustomerPhoneSnapshot());
        assertEquals(OFFER_ID, order.getItems().getFirst().getSourceOfferItemId());
        assertEquals("Call on arrival", order.getDeliveryAddressSnapshot().getDeliveryNote());
    }

    @Test
    void offerReplayReturnsStoredResultWithoutCallingRemoteServices() {
        CreateOfferOrderRequest request = new CreateOfferOrderRequest(
                OFFER_ID, REQUEST_ID, CUSTOMER_ID, ADDRESS_ID, null);
        OrderCreationResult replay = new OrderCreationResult(null, true);
        when(persistenceService.findReplay(eq("ACCEPTED_OFFER"), eq(CUSTOMER_ID), eq(IDEMPOTENCY_KEY), any()))
                .thenReturn(Optional.of(replay));

        OrderCreationResult result = service.createFromAcceptedOffer(IDEMPOTENCY_KEY, request);

        assertSame(replay, result);
        verify(marketplaceClient, never()).getAcceptedOfferOrderSource(any());
        verify(identityClient, never()).getUser(any());
    }

    private IdentityClient.UserResponse activeCustomer() {
        return new IdentityClient.UserResponse(
                CUSTOMER_ID, "alice@example.com", "Alice Customer", "+84901111111", "ACTIVE", List.of("CUSTOMER"));
    }

    private IdentityClient.AddressResponse address() {
        return new IdentityClient.AddressResponse(
                ADDRESS_ID, "Home", "Alice Receiver", "+84902222222", "123 Nguyen Trai",
                "Ben Thanh", "District 1", "Ho Chi Minh City",
                new BigDecimal("10.772000"), new BigDecimal("106.698000"));
    }

    private BakeryClient.CatalogQuoteResponse quote() {
        return new BakeryClient.CatalogQuoteResponse(
                UUID.randomUUID(), BAKERY_ID, "Sweet Bakery", PRODUCT_ID, "Birthday Cake", "Vanilla",
                1, List.of(new BakeryClient.QuotedItem(PRODUCT_ID, "CAKE", "Birthday Cake", "Vanilla",
                1, new BigDecimal("100.00"), new BigDecimal("100.00"), Map.of("size", "M"))),
                new BigDecimal("100.00"), new BigDecimal("20.00"), new BigDecimal("120.00"), 1,
                NOW.plusSeconds(300));
    }

    private MarketplaceClient.AcceptedOfferOrderSourceResponse offerSnapshot() {
        return new MarketplaceClient.AcceptedOfferOrderSourceResponse(
                OFFER_ID, REQUEST_ID, CUSTOMER_ID, BAKERY_ID, "Offer-time Alice", "+84901111111", "Sweet Bakery",
                List.of(new MarketplaceClient.OfferItemSnapshot(OFFER_ID, "CAKE", "Custom Cake", "Chocolate",
                        1, new BigDecimal("250.00"), new BigDecimal("250.00"), Map.of("flavor", "chocolate"))),
                new BigDecimal("250.00"), new BigDecimal("30.00"), new BigDecimal("280.00"), NOW.plusSeconds(7200));
    }
}
