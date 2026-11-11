package com.se193262.subscriptionservice.feature.payment;

import com.se193262.subscriptionservice.feature.payment.controller.VnpayController;
import com.se193262.subscriptionservice.feature.payment.service.VnpayService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class VnpayControllerTest {
    @Test @DisplayName("Duplicate callback parameters return VNPay checksum error without invoking settlement")
    void ipn_duplicateAmount_rejectsAmbiguousSignature() throws Exception {
        var service = mock(VnpayService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new VnpayController(service)).build();
        mvc.perform(get("/api/v1/payments/vnpay/ipn").param("vnp_Amount", "100", "200"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.RspCode").value("97"));
        verifyNoInteractions(service);
    }
}
