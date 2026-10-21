package com.se193262.subscriptionservice.feature.subscriptionorder.service.impl;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionOrderServiceImpl implements SubscriptionOrderService {
    private final SubscriptionOrderRepository orderRepository;
    private final SubscriptionPlanRepository planRepository;
    private final BakeryPaymentRepository paymentRepository;
    private final BakerySubscriptionRepository subscriptionRepository;
    private final long expiryHours;

    public SubscriptionOrderServiceImpl(SubscriptionOrderRepository orderRepository,
            SubscriptionPlanRepository planRepository, BakeryPaymentRepository paymentRepository,
            BakerySubscriptionRepository subscriptionRepository,
            @Value("${subscription.order-expiry-hours:24}") long expiryHours) {
        this.orderRepository = orderRepository;
        this.planRepository = planRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.expiryHours = expiryHours;
    }

    @Override @Transactional
    public SubscriptionOrderDto create(UUID bakeryId, UUID userId, String idempotencyKey,
                                       SubscriptionOrderDto request) {
        if (request == null || request.planId() == null || request.id() != null
                || request.orderNumber() != null || request.bakeryId() != null
                || request.requestedByUserId() != null || request.planNameSnapshot() != null
                || request.billingPeriodMonths() != null || request.totalAmount() != null
                || request.currency() != null || request.status() != null
                || request.expiresAt() != null || request.completedAt() != null
                || request.createdAt() != null || request.payments() != null || request.period() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Only planId is allowed in request body");
        }
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 200) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Valid Idempotency-Key is required");
        }
        String orderNumber = orderNumber(bakeryId, idempotencyKey);
        SubscriptionOrder existing = orderRepository.findByOrderNumber(orderNumber).orElse(null);
        if (existing != null) {
            if (!existing.getBakeryId().equals(bakeryId)
                    || !existing.getRequestedByUserId().equals(userId)
                    || !existing.getPlan().getId().equals(request.planId())) {
                throw new AppException(HttpStatus.CONFLICT, "Idempotency-Key was used with different order data");
            }
            return details(existing);
        }
        if (orderRepository.existsByBakeryIdAndStatusInAndExpiresAtAfter(bakeryId,
                List.of(SubscriptionOrderStatus.PENDING_PAYMENT, SubscriptionOrderStatus.PAYMENT_REVIEW),
                Instant.now())) {
            throw new AppException(HttpStatus.CONFLICT, "Bakery already has an open subscription order");
        }
        SubscriptionPlan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Plan not found"));
        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Plan is not active");
        }
        SubscriptionOrder order = new SubscriptionOrder(orderNumber, bakeryId, plan, userId,
                Instant.now().plus(expiryHours, ChronoUnit.HOURS));
        return details(orderRepository.saveAndFlush(order));
    }

    @Override @Transactional(readOnly = true)
    public PageResult<SubscriptionOrderDto> list(UUID bakeryId, SubscriptionOrderStatus status,
                                                 int page, int size) {
        if (page < 1 || size < 1 || size > 100) {
            throw new AppException(HttpStatus.BAD_REQUEST, "page must be >= 1 and size must be 1..100");
        }
        PageRequest pageable = PageRequest.of(page - 1, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        var orders = status == null
                ? orderRepository.findAllByBakeryId(bakeryId, pageable)
                : orderRepository.findAllByBakeryIdAndStatus(bakeryId, status, pageable);
        return PageResult.fromPage(orders.map(order ->
                SubscriptionOrderDto.fromEntity(order, List.of(), null)));
    }

    @Override @Transactional(readOnly = true)
    public SubscriptionOrderDto get(UUID orderId) {
        return details(orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription order not found")));
    }

    private SubscriptionOrderDto details(SubscriptionOrder order) {
        return SubscriptionOrderDto.fromEntity(order,
                paymentRepository.findAllByOrder_IdOrderBySubmittedAtAsc(order.getId()),
                subscriptionRepository.findBySourceOrder_Id(order.getId()).orElse(null));
    }

    private static String orderNumber(UUID bakeryId, String idempotencyKey) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(
                    (bakeryId + ":" + idempotencyKey).getBytes(StandardCharsets.UTF_8));
            return "SUB-" + HexFormat.of().formatHex(digest).substring(0, 36);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
