package com.se193262.subscriptionservice.feature.payment.service;

import com.se193262.subscriptionservice.feature.payment.dto.VnpayCheckoutResponse;
import com.se193262.subscriptionservice.feature.payment.dto.VnpayAttemptResponse;
import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import java.util.Map;
import java.util.UUID;

public interface VnpayService {
    VnpayCheckoutResponse checkout(UUID orderId, UUID userId, String ipAddress);
    Map<String, String> ipn(Map<String, String> parameters);
    Map<String, String> returnResult(Map<String, String> parameters);
    PageResult<VnpayAttemptResponse> listAttempts(VnpayAttempt.Status status, int page, int size);
}
