package com.se193262.subscriptionservice.feature.subscriptionorder.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.se193262.subscriptionservice.feature.subscriptionorder.dto.AdminSubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.AdminSubscriptionOrderFilter;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
public class AdminSubscriptionOrderController {
    private final SubscriptionOrderService orders;

    public AdminSubscriptionOrderController(SubscriptionOrderService orders) { this.orders = orders; }

    @GetMapping("/api/v1/admin/subscription-orders")
    public ApiResponse<PageResult<AdminSubscriptionOrderDto>> list(@Valid @ModelAttribute AdminSubscriptionOrderFilter filter) {
        return ApiResponse.success(orders.listAdmin(filter));
    }
}
