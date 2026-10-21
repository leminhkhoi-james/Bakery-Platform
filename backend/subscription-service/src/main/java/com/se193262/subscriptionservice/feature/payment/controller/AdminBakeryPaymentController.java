package com.se193262.subscriptionservice.feature.payment.controller;

import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.shared.dto.ApiResponse;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import org.springframework.context.annotation.Profile;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@Profile("!prod")
@RequestMapping("/api/v1/admin/bakery-payments")
public class AdminBakeryPaymentController {
    private final BakeryPaymentService paymentService;

    public AdminBakeryPaymentController(BakeryPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<BakeryPaymentDto>>> list(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) UUID bakeryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant submittedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant submittedTo,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.listForReview(
                status, bakeryId, submittedFrom, submittedTo, page, size)));
    }
}
