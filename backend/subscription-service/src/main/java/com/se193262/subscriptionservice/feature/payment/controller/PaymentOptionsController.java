package com.se193262.subscriptionservice.feature.payment.controller;

import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentOptionsController {
    private final BakeryPaymentService payments;

    public PaymentOptionsController(BakeryPaymentService payments) {
        this.payments = payments;
    }

    @GetMapping("/api/v1/subscription-plans/payment-options")
    public ApiResponse<PaymentOptions> options() {
        return ApiResponse.success(new PaymentOptions(payments.isSandboxEnabled()));
    }

    public record PaymentOptions(boolean sandboxEnabled) { }
}
