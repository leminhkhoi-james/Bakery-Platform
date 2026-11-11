package com.se193262.subscriptionservice.feature.payment.dto;

import java.time.Instant;
import java.util.UUID;

public record VnpayCheckoutResponse(UUID attemptId, UUID orderId, String paymentUrl, Instant expiresAt) { }
