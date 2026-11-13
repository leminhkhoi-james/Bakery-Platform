package com.se193262.subscriptionservice.feature.payment.controller;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.VnpayCheckoutResponse;
import com.se193262.subscriptionservice.feature.payment.dto.VnpayAttemptResponse;
import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import com.se193262.subscriptionservice.feature.payment.service.VnpayService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
public class VnpayController {
    private final VnpayService vnpay;

    public VnpayController(VnpayService vnpay) { this.vnpay = vnpay; }

    @PostMapping("/api/v1/subscription-orders/{orderId}/vnpay/checkout")
    public ApiResponse<VnpayCheckoutResponse> checkout(@PathVariable UUID orderId,
            @AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        return ApiResponse.success(vnpay.checkout(orderId, UUID.fromString(jwt.getSubject()), request.getRemoteAddr()));
    }

    @GetMapping("/api/v1/payments/vnpay/ipn")
    public Map<String, String> ipn(@RequestParam MultiValueMap<String, String> parameters) {
        if (hasDuplicates(parameters)) return Map.of("RspCode", "97", "Message", "Duplicate parameters");
        return vnpay.ipn(parameters.toSingleValueMap());
    }

    @GetMapping("/api/v1/payments/vnpay/return")
    public ApiResponse<Map<String, String>> result(@RequestParam MultiValueMap<String, String> parameters) {
        if (hasDuplicates(parameters)) throw new AppException(HttpStatus.BAD_REQUEST, "Duplicate VNPay parameters");
        return ApiResponse.success(vnpay.returnResult(parameters.toSingleValueMap()));
    }

    private boolean hasDuplicates(MultiValueMap<String, String> parameters) {
        return parameters.values().stream().anyMatch(values -> values.size() != 1);
    }

    @GetMapping("/api/v1/admin/vnpay-attempts")
    public ApiResponse<PageResult<VnpayAttemptResponse>>
            list(@RequestParam(required = false) VnpayAttempt.Status status,
                 @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(vnpay.listAttempts(status, page, size));
    }
}
