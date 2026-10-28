package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.BakeryServiceClient;
import com.se193262.orderservice.shared.dto.PageResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderManagementAuthorizationTest {

    private static final UUID CUSTOMER_ID = UUID.randomUUID();
    private static final UUID OTHER_CUSTOMER_ID = UUID.randomUUID();
    private static final UUID BAKERY_ID = UUID.randomUUID();
    private static final UUID ORDER_ID = UUID.randomUUID();

    @Mock
    private OrderQueryPersistenceService persistenceService;
    @Mock
    private BakeryServiceClient bakeryClient;

    private OrderManagementServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OrderManagementServiceImpl(persistenceService, bakeryClient);
    }

    @Test
    void allOrdersScopeRequiresAdminRole() {
        assertThrows(OrderAccessDeniedException.class, () -> service.listOrders(
                CUSTOMER_ID, Set.of("CUSTOMER"), "all", null, null, null, null,
                null, 1, 20, "createdAt,desc"));

        verify(persistenceService, never()).list(any(), eq(1), eq(20), any(Sort.class));
    }

    @Test
    void bakeryScopeRequiresAnActiveMembership() {
        when(bakeryClient.getMembershipAuthorization(BAKERY_ID, CUSTOMER_ID, "OWNER"))
                .thenReturn(new BakeryClient.MembershipAuthorizationResponse(
                        BAKERY_ID, CUSTOMER_ID, false, "OWNER", false));

        assertThrows(OrderAccessDeniedException.class, () -> service.listOrders(
                CUSTOMER_ID, Set.of("BAKERY_OWNER"), "bakery", BAKERY_ID, null, null,
                null, null, 1, 20, "createdAt,desc"));

        verify(persistenceService, never()).list(any(), eq(1), eq(20), any(Sort.class));
    }

    @Test
    void customerCanReadOnlyOwnedOrder() {
        when(persistenceService.getAuthorizationContext(ORDER_ID))
                .thenReturn(new OrderAuthorizationContext(CUSTOMER_ID, BAKERY_ID));
        when(persistenceService.getOrder(ORDER_ID)).thenReturn(null);
        service.getOrder(ORDER_ID, CUSTOMER_ID, Set.of("CUSTOMER"));
        verify(persistenceService).getOrder(ORDER_ID);

        when(persistenceService.getAuthorizationContext(ORDER_ID))
                .thenReturn(new OrderAuthorizationContext(CUSTOMER_ID, BAKERY_ID));
        assertThrows(OrderAccessDeniedException.class,
                () -> service.getOrder(ORDER_ID, OTHER_CUSTOMER_ID, Set.of("CUSTOMER")));
    }

    @Test
    @DisplayName("Customer platform role cannot read bakery orders")
    void getOrder_withCustomerRole_isForbidden() {
        when(persistenceService.getAuthorizationContext(ORDER_ID))
                .thenReturn(new OrderAuthorizationContext(CUSTOMER_ID, BAKERY_ID));
        assertThrows(OrderAccessDeniedException.class,
                () -> service.getOrder(ORDER_ID, OTHER_CUSTOMER_ID, Set.of("CUSTOMER")));
        verify(persistenceService, never()).getOrder(ORDER_ID);
    }

    @Test
    @DisplayName("Owner JWT cannot use a invalid membership")
    void getOrder_withInvalidMembership_isForbidden() {
        when(persistenceService.getAuthorizationContext(ORDER_ID))
                .thenReturn(new OrderAuthorizationContext(CUSTOMER_ID, BAKERY_ID));
        when(bakeryClient.getMembershipAuthorization(BAKERY_ID, OTHER_CUSTOMER_ID, "OWNER"))
                .thenReturn(new BakeryClient.MembershipAuthorizationResponse(
                        BAKERY_ID, OTHER_CUSTOMER_ID, true, "INVALID", true));
        assertThrows(OrderAccessDeniedException.class,
                () -> service.getOrder(ORDER_ID, OTHER_CUSTOMER_ID, Set.of("BAKERY_OWNER")));
        verify(persistenceService, never()).getOrder(ORDER_ID);
    }

    @Test
    void activeBakeryMembershipAllowsBakeryOrderRead() {
        when(persistenceService.getAuthorizationContext(ORDER_ID))
                .thenReturn(new OrderAuthorizationContext(CUSTOMER_ID, BAKERY_ID));
        when(bakeryClient.getMembershipAuthorization(BAKERY_ID, OTHER_CUSTOMER_ID, "OWNER"))
                .thenReturn(new BakeryClient.MembershipAuthorizationResponse(
                        BAKERY_ID, OTHER_CUSTOMER_ID, true, "OWNER", true));
        when(persistenceService.getOrder(ORDER_ID)).thenReturn(null);

        service.getOrder(ORDER_ID, OTHER_CUSTOMER_ID, Set.of("BAKERY_OWNER"));

        verify(persistenceService).getOrder(ORDER_ID);
    }
}
