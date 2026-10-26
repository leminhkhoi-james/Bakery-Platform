package com.se193262.subscriptionservice.feature.payment.service.impl;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.BakeryPaymentDto;
import com.se193262.subscriptionservice.feature.payment.dto.PaymentReviewResponse;
import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscription.dto.BakerySubscriptionDto;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class BakeryPaymentServiceImpl implements BakeryPaymentService {
    private final BakeryPaymentRepository paymentRepository;
    private final SubscriptionOrderRepository orderRepository;
    private final BakerySubscriptionRepository subscriptionRepository;
    private final BakeryAccessClient bakeryClient;
    private final PaymentProofStorage proofStorage;
    private final TransactionTemplate transactions;

    public BakeryPaymentServiceImpl(BakeryPaymentRepository paymentRepository,
                                    SubscriptionOrderRepository orderRepository,
                                    BakerySubscriptionRepository subscriptionRepository,
                                    BakeryAccessClient bakeryClient, PaymentProofStorage proofStorage,
                                    TransactionTemplate transactions) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.bakeryClient = bakeryClient;
        this.proofStorage = proofStorage;
        this.transactions = transactions;
    }

    @Override
    public BakeryPaymentDto submit(UUID orderId, UUID userId, String idempotencyKey,
                                   BakeryPaymentDto request, MultipartFile proof) {
        if (request == null || request.id() != null || request.subscriptionOrderId() != null
                || request.submittedByUserId() != null || request.status() != null
                || request.reviewedByAdminId() != null || request.reviewNote() != null
                || request.submittedAt() != null || request.reviewedAt() != null
                || request.proofUrl() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Payment server fields are read-only");
        }
        try { UUID.fromString(idempotencyKey); }
        catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Valid Idempotency-Key UUID is required");
        }
        String method = required(request.paymentMethod(), "paymentMethod");
        String reference = request.paymentReference() == null || request.paymentReference().isBlank()
                ? null : request.paymentReference().trim();
        boolean hasProof = proof != null && !proof.isEmpty();
        if (reference == null && !hasProof) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Payment reference or proof is required");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "amount must be positive");
        }
        SubscriptionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription order not found"));
        bakeryClient.requireMember(order.getBakeryId(), userId, true);
        String hash = hash(orderId + ":" + idempotencyKey);
        boolean retry = paymentRepository.findByIdempotencyKeyHash(hash).isPresent();
        if (!retry) validateOrder(order, request);
        if (retry) return transactions.execute(status -> persistSubmission(orderId, userId,
                request, method, reference, hash, hasProof, null, new AtomicBoolean()));
        String proofKey = hasProof ? proofStorage.upload(proof, orderId) : null;
        AtomicBoolean used = new AtomicBoolean();
        try {
            BakeryPaymentDto response = transactions.execute(status -> persistSubmission(orderId,
                    userId, request, method, reference, hash, hasProof, proofKey, used));
            if (proofKey != null && !used.get()) proofStorage.deleteQuietly(proofKey);
            return response;
        } catch (RuntimeException exception) {
            if (proofKey != null) proofStorage.deleteQuietly(proofKey);
            throw exception;
        }
    }

    private BakeryPaymentDto persistSubmission(UUID orderId, UUID userId,
            BakeryPaymentDto request, String method, String reference, String hash,
            boolean hasProof, String proofKey, AtomicBoolean used) {
        BakeryPayment existing = paymentRepository.findByIdempotencyKeyHash(hash).orElse(null);
        if (existing != null) {
            if (!existing.getOrder().getId().equals(orderId)
                    || !existing.getSubmittedByUserId().equals(userId)
                    || !existing.getPaymentMethod().equals(method)
                    || !java.util.Objects.equals(existing.getPaymentReference(), reference)
                    || existing.getAmount().compareTo(request.amount()) != 0
                    || !existing.getCurrency().equals(request.currency())
                    || (hasProof && existing.getProofObjectKey() == null)) {
                throw new AppException(HttpStatus.CONFLICT, "Idempotency-Key was used with different payment data");
            }
            return toDto(existing);
        }
        SubscriptionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription order not found"));
        validateOrder(order, request);
        if (reference != null && paymentRepository.findByPaymentReference(reference).isPresent()) {
            throw new AppException(HttpStatus.CONFLICT, "Payment reference already exists");
        }
        BakeryPayment payment = new BakeryPayment(order, userId, method, reference, hash,
                request.amount(), request.currency(), proofKey);
        order.submitPayment();
        BakeryPayment saved = paymentRepository.saveAndFlush(payment);
        orderRepository.flush();
        used.set(true);
        return toDto(saved);
    }

    private void validateOrder(SubscriptionOrder order, BakeryPaymentDto request) {
        if (order.getStatus() != SubscriptionOrderStatus.PENDING_PAYMENT
                || !order.getExpiresAt().isAfter(Instant.now())) {
            throw new AppException(HttpStatus.CONFLICT, "Order is not awaiting payment");
        }
        if (order.getTotalAmount().compareTo(request.amount()) != 0
                || !order.getCurrency().equals(request.currency())) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Payment amount or currency differs from order");
        }
    }

    @Override @Transactional(readOnly = true)
    public PageResult<BakeryPaymentDto> listForReview(PaymentStatus status, UUID bakeryId,
            Instant submittedFrom, Instant submittedTo, int page, int size, String sort) {
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
        Sort.Direction direction = switch (sort) {
            case "submittedAt,asc" -> Sort.Direction.ASC;
            case "submittedAt,desc" -> Sort.Direction.DESC;
            default -> throw new AppException(HttpStatus.BAD_REQUEST, "Invalid payment sort");
        };
        return PageResult.fromPage(paymentRepository.findAll(filter,
                PageRequest.of(page - 1, size, Sort.by(direction, "submittedAt")))
                .map(this::toDto));
    }

    @Override @Transactional
    public PaymentReviewResponse approve(UUID paymentId, UUID adminId, String idempotencyKey,
            String reviewNote) {
        String keyHash = reviewKey(idempotencyKey);
        BakeryPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Payment not found"));
        SubscriptionOrder order = payment.getOrder();
        if (payment.getStatus() == PaymentStatus.APPROVED
                && keyHash.equals(payment.getReviewIdempotencyKeyHash())
                && adminId.equals(payment.getReviewedByAdminId())
                && java.util.Objects.equals(reviewNote, payment.getReviewNote())) {
            BakerySubscription existing = subscriptionRepository.findBySourceOrder_Id(order.getId())
                    .orElseThrow(() -> new AppException(HttpStatus.CONFLICT, "Approved period is missing"));
            return reviewResponse(payment, order, existing);
        }
        if (payment.getStatus() != PaymentStatus.SUBMITTED
                || order.getStatus() != SubscriptionOrderStatus.PAYMENT_REVIEW) {
            throw new AppException(HttpStatus.CONFLICT, "Payment is not awaiting review");
        }
        if (order.getTotalAmount().compareTo(payment.getAmount()) != 0
                || !order.getCurrency().equals(payment.getCurrency())) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Payment differs from order");
        }
        if (!subscriptionRepository.tryLockBakery(order.getBakeryId())) {
            throw new AppException(HttpStatus.CONFLICT, "Another subscription approval is in progress");
        }
        if (subscriptionRepository.findBySourceOrder_Id(order.getId()).isPresent()) {
            throw new AppException(HttpStatus.CONFLICT, "Order already has a subscription period");
        }
        Instant now = Instant.now();
        subscriptionRepository.findAllByBakeryIdOrderByPeriodStartDesc(order.getBakeryId())
                .stream().filter(period -> period.getStatus() == SubscriptionStatus.ACTIVE
                        && !period.getPeriodEnd().isAfter(now))
                .forEach(BakerySubscription::expire);
        subscriptionRepository.flush();
        Instant start = subscriptionRepository.findAllByBakeryIdOrderByPeriodStartDesc(order.getBakeryId())
                .stream().filter(period -> period.getStatus() == SubscriptionStatus.ACTIVE
                        || period.getStatus() == SubscriptionStatus.SCHEDULED)
                .map(BakerySubscription::getPeriodEnd).filter(end -> end.isAfter(now))
                .max(Instant::compareTo).orElse(now);
        Instant end = start.atZone(ZoneOffset.UTC).plusMonths(order.getBillingPeriodMonths()).toInstant();
        if (!end.isAfter(start)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid subscription period");
        }
        BakerySubscription period = new BakerySubscription(order, start, end, now);
        payment.approve(adminId, reviewNote, keyHash, now);
        order.complete(now);
        subscriptionRepository.saveAndFlush(period);
        paymentRepository.flush();
        orderRepository.flush();
        return reviewResponse(payment, order, period);
    }

    @Override @Transactional
    public PaymentReviewResponse reject(UUID paymentId, UUID adminId, String reviewNote) {
        if (reviewNote == null || reviewNote.isBlank()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "reviewNote is required");
        }
        BakeryPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Payment not found"));
        SubscriptionOrder order = payment.getOrder();
        if (payment.getStatus() != PaymentStatus.SUBMITTED
                || order.getStatus() != SubscriptionOrderStatus.PAYMENT_REVIEW) {
            throw new AppException(HttpStatus.CONFLICT, "Payment is not awaiting review");
        }
        Instant now = Instant.now();
        payment.reject(adminId, reviewNote.trim(), now);
        order.rejectPayment(now);
        paymentRepository.flush();
        orderRepository.flush();
        return reviewResponse(payment, order, null);
    }

    private PaymentReviewResponse reviewResponse(BakeryPayment payment, SubscriptionOrder order,
            BakerySubscription period) {
        return new PaymentReviewResponse(BakeryPaymentDto.fromEntity(payment),
                SubscriptionOrderDto.fromEntity(order, List.of(payment), period),
                period == null ? null : BakerySubscriptionDto.Period.fromEntity(period));
    }

    private BakeryPaymentDto toDto(BakeryPayment payment) {
        return BakeryPaymentDto.fromEntity(payment, proofStorage.signedUrl(payment.getProofObjectKey()));
    }

    private static String reviewKey(String idempotencyKey) {
        try {
            UUID.fromString(idempotencyKey);
        } catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Valid Idempotency-Key UUID is required");
        }
        return hash("approve:" + idempotencyKey);
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
