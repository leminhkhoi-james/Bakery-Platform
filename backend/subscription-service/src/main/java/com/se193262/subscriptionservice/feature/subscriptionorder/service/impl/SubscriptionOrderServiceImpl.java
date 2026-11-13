package com.se193262.subscriptionservice.feature.subscriptionorder.service.impl;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.AdminSubscriptionOrderDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.AdminSubscriptionOrderFilter;
import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import org.springframework.data.jpa.domain.Specification;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.service.SubscriptionOrderService;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.storage.PaymentProofStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

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
    private final BakeryAccessClient bakeryClient;
    private final PaymentProofStorage proofStorage;
    private final TransactionTemplate transactions;
    private final long expiryHours;

    public SubscriptionOrderServiceImpl(SubscriptionOrderRepository orderRepository,
            SubscriptionPlanRepository planRepository, BakeryPaymentRepository paymentRepository,
            BakerySubscriptionRepository subscriptionRepository, BakeryAccessClient bakeryClient,
            PaymentProofStorage proofStorage, TransactionTemplate transactions,
            @Value("${subscription.order-expiry-hours:24}") long expiryHours) {
        this.orderRepository = orderRepository;
        this.planRepository = planRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.bakeryClient = bakeryClient;
        this.proofStorage = proofStorage;
        this.transactions = transactions;
        this.expiryHours = expiryHours;
    }

    @Override
    public SubscriptionOrderDto create(UUID bakeryId, UUID userId, String idempotencyKey,
                                       SubscriptionOrderDto request) {
        bakeryClient.requireMember(bakeryId, userId, true);
        bakeryClient.requireApprovedBakery(bakeryId);
        return transactions.execute(status -> createInTransaction(bakeryId, userId, idempotencyKey, request));
    }

    private SubscriptionOrderDto createInTransaction(UUID bakeryId, UUID userId,
            String idempotencyKey, SubscriptionOrderDto request) {
        if (request == null || request.planId() == null || request.id() != null
                || request.orderNumber() != null || request.bakeryId() != null
                || request.requestedByUserId() != null || request.planNameSnapshot() != null
                || request.planCodeSnapshot() != null || request.featuresSnapshot() != null
                || request.billingPeriodMonths() != null || request.totalAmount() != null
                || request.currency() != null || request.status() != null
                || request.expiresAt() != null || request.completedAt() != null
                || request.createdAt() != null || request.payments() != null || request.period() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Only planId is allowed in request body");
        }
        try { UUID.fromString(idempotencyKey); }
        catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Valid Idempotency-Key UUID is required");
        }
        String orderNumber = orderNumber(bakeryId, idempotencyKey);
        // Serialize creation and approval for this bakery across application instances.
        if (!subscriptionRepository.tryLockBakery(bakeryId)) {
            throw new AppException(HttpStatus.CONFLICT, "Another subscription operation is in progress");
        }
        SubscriptionOrder existing = orderRepository.findByOrderNumber(orderNumber).orElse(null);
        if (existing != null) {
            if (!existing.getBakeryId().equals(bakeryId)
                    || !existing.getRequestedByUserId().equals(userId)
                    || !existing.getPlan().getId().equals(request.planId())) {
                throw new AppException(HttpStatus.CONFLICT, "Idempotency-Key was used with different order data");
            }
            return details(existing, userId);
        }
        if (orderRepository.existsByBakeryIdAndStatus(bakeryId, SubscriptionOrderStatus.PAYMENT_REVIEW)
                || orderRepository.existsByBakeryIdAndStatusInAndExpiresAtAfter(bakeryId,
                List.of(SubscriptionOrderStatus.PENDING_PAYMENT), Instant.now())) {
            throw new AppException(HttpStatus.CONFLICT, "Bakery already has an open subscription order");
        }
        SubscriptionPlan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Plan not found"));
        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Plan is not active");
        }
        SubscriptionOrder order = new SubscriptionOrder(orderNumber, bakeryId, plan, userId,
                Instant.now().plus(expiryHours, ChronoUnit.HOURS));
        return details(orderRepository.saveAndFlush(order), userId);
    }

    @Override @Transactional(readOnly = true)
    public PageResult<SubscriptionOrderDto> list(UUID bakeryId, UUID userId, boolean admin,
            SubscriptionOrderStatus status, int page, int size, String sort) {
        if (admin) bakeryClient.requireBakery(bakeryId);
        else bakeryClient.requireMember(bakeryId, userId, false);
        if (page < 1 || size < 1 || size > 100) {
            throw new AppException(HttpStatus.BAD_REQUEST, "page must be >= 1 and size must be 1..100");
        }
        Sort.Direction direction = switch (sort) {
            case "createdAt,desc" -> Sort.Direction.DESC;
            case "createdAt,asc" -> Sort.Direction.ASC;
            default -> throw new AppException(HttpStatus.BAD_REQUEST, "Invalid order sort");
        };
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(direction, "createdAt"));
        var orders = status == null
                ? orderRepository.findAllByBakeryId(bakeryId, pageable)
                : orderRepository.findAllByBakeryIdAndStatus(bakeryId, status, pageable);
        return PageResult.fromPage(orders.map(order ->
                SubscriptionOrderDto.fromEntity(order, List.of(), null)));
    }

    @Override @Transactional(readOnly = true)
    public PageResult<AdminSubscriptionOrderDto> listAdmin(AdminSubscriptionOrderFilter filter) {
        if (filter.page() < 1 || filter.size() < 1 || filter.size() > 100
                || filter.query() != null && filter.query().length() > 120) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid order filters");
        }
        if (filter.createdFrom() != null && filter.createdTo() != null && filter.createdFrom().isAfter(filter.createdTo())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Start date must not be after end date");
        }
        var orders = orderRepository.findAll(adminFilter(filter), PageRequest.of(filter.page() - 1, filter.size(),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        var paymentsByOrder = orders.isEmpty() ? java.util.Map.<UUID, List<BakeryPayment>>of()
                : paymentRepository.findAllByOrder_IdInOrderBySubmittedAtDesc(
                        orders.stream().map(SubscriptionOrder::getId).toList()).stream()
                        .collect(java.util.stream.Collectors.groupingBy(payment -> payment.getOrder().getId()));
        return PageResult.fromPage(orders.map(order -> AdminSubscriptionOrderDto.fromEntity(order,
                paymentsByOrder.getOrDefault(order.getId(), List.of()))));
    }

    private Specification<SubscriptionOrder> adminFilter(AdminSubscriptionOrderFilter filter) {
        return (root, query, builder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (filter.status() != null) predicates.add(builder.equal(root.get("status"), filter.status()));
            if (filter.bakeryId() != null) predicates.add(builder.equal(root.get("bakeryId"), filter.bakeryId()));
            if (filter.createdFrom() != null) predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), filter.createdFrom()));
            if (filter.createdTo() != null) predicates.add(builder.lessThanOrEqualTo(root.get("createdAt"), filter.createdTo()));
            if (filter.query() != null && !filter.query().isBlank()) {
                String value = filter.query().trim().toLowerCase(java.util.Locale.ROOT);
                String pattern = "%" + value.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
                var textMatch = builder.or(builder.like(builder.lower(root.get("orderNumber")), pattern, '!'),
                        builder.like(builder.lower(root.get("planNameSnapshot")), pattern, '!'),
                        builder.like(builder.lower(root.get("planCodeSnapshot")), pattern, '!'));
                predicates.add(value.matches("[0-9]{1,10}(\\.[0-9]{1,2})?")
                        ? builder.or(textMatch, builder.equal(root.get("totalAmount"), new java.math.BigDecimal(value))) : textMatch);
            }
            if (filter.eligibleForApproval() != null) {
                var paymentQuery = query.subquery(UUID.class);
                var payment = paymentQuery.from(BakeryPayment.class);
                paymentQuery.select(payment.get("id")).where(
                        builder.equal(payment.get("order").get("id"), root.get("id")),
                        builder.equal(payment.get("status"), PaymentStatus.SUBMITTED),
                        builder.notEqual(builder.upper(payment.get("paymentMethod")), "VNPAY"),
                        builder.greaterThan(payment.get("amount"), java.math.BigDecimal.ZERO),
                        builder.equal(payment.get("amount"), root.get("totalAmount")),
                        builder.equal(payment.get("currency"), root.get("currency")));
                var eligible = builder.and(builder.equal(root.get("status"), SubscriptionOrderStatus.PAYMENT_REVIEW),
                        builder.exists(paymentQuery));
                predicates.add(filter.eligibleForApproval() ? eligible : builder.not(eligible));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    @Override @Transactional(readOnly = true)
    public SubscriptionOrderDto get(UUID orderId, UUID userId, boolean admin) {
        SubscriptionOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription order not found"));
        if (!admin) bakeryClient.requireMember(order.getBakeryId(), userId, false);
        return details(order, admin ? null : userId);
    }

    private SubscriptionOrderDto details(SubscriptionOrder order, UUID viewerId) {
        return SubscriptionOrderDto.fromEntity(order,
                paymentRepository.findAllByOrder_IdOrderBySubmittedAtAsc(order.getId()),
                subscriptionRepository.findBySourceOrder_Id(order.getId()).orElse(null),
                payment -> viewerId == null || viewerId.equals(payment.getSubmittedByUserId())
                        ? proofStorage.signedUrl(payment.getProofObjectKey()) : null);
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
