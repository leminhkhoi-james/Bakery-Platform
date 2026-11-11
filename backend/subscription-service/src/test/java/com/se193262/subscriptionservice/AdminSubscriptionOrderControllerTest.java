package com.se193262.subscriptionservice;

import com.se193262.subscriptionservice.feature.subscriptionorder.controller.AdminSubscriptionOrderController;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.AdminSubscriptionOrderFilter;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminSubscriptionOrderControllerTest {
    @Test @DisplayName("Admin filter binds default pagination and explicit order eligibility filters")
    void list_defaultsAndExplicitFilters_bindRecord() throws Exception {
        var service = mock(SubscriptionOrderService.class);
        when(service.listAdmin(any())).thenReturn(new PageResult<>(new PageResult.Meta(1, 20, 0, 0), List.of()));
        var mvc = MockMvcBuilders.standaloneSetup(new AdminSubscriptionOrderController(service)).build();
        mvc.perform(get("/api/v1/admin/subscription-orders")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/subscription-orders").param("status", "PENDING_PAYMENT")
                .param("eligibleForApproval", "false").param("query", "499000")
                .param("createdFrom", "2026-11-01T00:00:00Z").param("page", "2").param("size", "10"))
                .andExpect(status().isOk());
        var filters = ArgumentCaptor.forClass(AdminSubscriptionOrderFilter.class);
        verify(service, times(2)).listAdmin(filters.capture());
        assertThat(filters.getAllValues().getFirst().page()).isEqualTo(1);
        assertThat(filters.getAllValues().getFirst().size()).isEqualTo(20);
        assertThat(filters.getValue().status()).isEqualTo(SubscriptionOrderStatus.PENDING_PAYMENT);
        assertThat(filters.getValue().eligibleForApproval()).isFalse();
        assertThat(filters.getValue().query()).isEqualTo("499000");
        assertThat(filters.getValue().page()).isEqualTo(2);
        assertThat(filters.getValue().createdFrom()).isNotNull();
    }

    @Test @DisplayName("Invalid pagination or enum filters never reach the order service")
    void list_invalidFilters_returns400() throws Exception {
        var service = mock(SubscriptionOrderService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new AdminSubscriptionOrderController(service)).build();
        mvc.perform(get("/api/v1/admin/subscription-orders").param("size", "101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/admin/subscription-orders").param("status", "PAID")).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
