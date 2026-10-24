package com.se193262.bakeryservice.feature.catalog;

import com.se193262.bakeryservice.exception.GlobalExceptionHandler;
import com.se193262.bakeryservice.feature.bakery.controller.InternalBakeryController;
import com.se193262.bakeryservice.feature.bakery.service.BakeryInternalService;
import com.se193262.bakeryservice.feature.catalog.controller.InternalCatalogController;
import com.se193262.bakeryservice.feature.catalog.service.CatalogQuoteService;
import com.se193262.platform.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class InternalCatalogRoutingTest {
    private final BakeryInternalService bakeryService = mock(BakeryInternalService.class);
    private final CatalogService customizationService = mock(CatalogService.class);
    private final CatalogQuoteService directOrderService = mock(CatalogQuoteService.class);
    private MockMvc mvc;
    private static final UUID ID = UUID.fromString("20000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new InternalBakeryController(bakeryService),
                        new CatalogController(customizationService),
                        new InternalCatalogController(directOrderService))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    @DisplayName("Profile and member authorization have a single controller after merge")
    void profileAndMembership_requests_useCanonicalController() throws Exception {
        mvc.perform(get("/internal/v1/bakeries/" + ID))
                .andExpect(status().isOk()).andExpect(handler().handlerType(InternalBakeryController.class));
        mvc.perform(get("/internal/v1/bakeries/" + ID + "/members/" + ID + "/authorization"))
                .andExpect(status().isOk()).andExpect(handler().handlerType(InternalBakeryController.class));
    }

    @Test
    @DisplayName("Direct order and customization quote payloads reach distinct handlers")
    void quote_contracts_reachDistinctHandlers() throws Exception {
        String body = """
                {"bakeryId":"%s","productId":"%s","quantity":1,
                 "deliveryCity":"HCM","deliveryDistrict":"D1","optionSelections":[],"addOns":[]}
                """.formatted(ID, ID);
        mvc.perform(post("/internal/v1/catalog/quotes").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(handler().handlerType(InternalCatalogController.class));
        mvc.perform(post("/internal/v1/catalog/customization-quotes")
                        .contentType(MediaType.APPLICATION_JSON).content(body.replace("\"quantity\":1,", "")))
                .andExpect(status().isOk()).andExpect(handler().handlerType(CatalogController.class));
        verify(directOrderService).quote(any());
        verify(customizationService).quote(any(), eq(true));
    }

    @Test
    @DisplayName("Shared catalog business exceptions preserve their HTTP status")
    void memberships_missingResource_returns404() throws Exception {
        when(customizationService.memberships(ID)).thenThrow(BusinessException.missing());
        mvc.perform(get("/internal/v1/users/" + ID + "/bakery-memberships"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.statusCode").value(404));
    }
}
