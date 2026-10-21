package com.se193262.subscriptionservice.feature.payment.service.impl;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class BakeryPaymentServiceImpl implements BakeryPaymentService {
    private final BakeryPaymentRepository paymentRepository;
    private final SubscriptionOrderRepository orderRepository;

    public BakeryPaymentServiceImpl(BakeryPaymentRepository paymentRepository,
                                    SubscriptionOrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Override @Transactional
    public BakeryPaymentDto submit(UUID orderId, UUID userId, String idempotencyKey,
                                   BakeryPaymentDto request, boolean proofProvided) {
        if (proofProvided) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Payment proof storage is not configured");
        }
        if (request == null || request.id() != null || request.subscriptionOrderId() != null
                || request.submittedByUserId() != null || request.status() != null
                || request.reviewedByAdminId() != null || request.reviewNote() != null
                || request.submittedAt() != null || request.reviewedAt() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Payment server fields are read-only");
        }
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 200) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Valid Idempotency-Key is required");
        }
        String method = required(request.paymentMethod(), "paymentMethod");
        String reference = required(request.paymentReference(), "paymentReference");
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "amount must be positive");
        }
        String hash = hash(orderId + ":" + idempotencyKey);
        BakeryPayment existing = paymentRepository.findByIdempotencyKeyHash(hash).orElse(null);
        if (existing != null) {
            if (!existing.getOrder().getId().equals(orderId)
                    || !existing.getSubmittedByUserId().equals(userId)
                    || !existing.getPaymentMethod().equals(method)
                    || !existing.getPaymentReference().equals(reference)
                    || existing.getAmount().compareTo(request.amount()) != 0
                    || !existing.getCurrency().equals(request.currency())) {
                throw new AppException(HttpStatus.CONFLICT, "Idempotency-Key was used with different payment data");
            }
            return BakeryPaymentDto.fromEntity(existing);
        }
        SubscriptionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription order not found"));
        if (!order.getRequestedByUserId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Only the order requester can submit payment");
        }
        if (order.getStatus() != SubscriptionOrderStatus.PENDING_PAYMENT
                || !order.getExpiresAt().isAfter(Instant.now())) {
            throw new AppException(HttpStatus.CONFLICT, "Order is not awaiting payment");
        }
        if (order.getTotalAmount().compareTo(request.amount()) != 0
                || !order.getCurrency().equals(request.currency())) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Payment amount or currency differs from order");
        }
        if (paymentRepository.findByPaymentReference(reference).isPresent()) {
            throw new AppException(HttpStatus.CONFLICT, "Payment reference already exists");
        }
        BakeryPayment payment = new BakeryPayment(order, userId, method, reference, hash,
                request.amount(), request.currency());
        order.submitPayment();
        BakeryPayment saved = paymentRepository.saveAndFlush(payment);
        orderRepository.flush();
        return BakeryPaymentDto.fromEntity(saved);
    }

    @Override @Transactional(readOnly = true)
    public PageResult<BakeryPaymentDto> listForReview(PaymentStatus status, UUID bakeryId,
            Instant submittedFrom, Instant submittedTo, int page, int size) {
        if (page < 1 || size < 1 || size > 100
                || (submittedFrom != null && submittedTo != null && submittedFrom.isAfter(submittedTo))) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid pagination or submitted date range");
        }
        Specification<BakeryPayment> filter = (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            if (bakeryId != null) predicates.add(builder.equal(root.get("order").get("bakeryId"), bakeryId));
            if (submittedFrom != null) predicates.add(builder.greaterThanOrEqualTo(root.get("submittedAt"), submittedFrom));
            if (submittedTo != null) predicates.add(builder.lessThanOrEqualTo(root.get("submittedAt"), submittedTo));
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        return PageResult.fromPage(paymentRepository.findAll(filter,
                PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "submittedAt")))
                .map(BakeryPaymentDto::fromEntity));
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
