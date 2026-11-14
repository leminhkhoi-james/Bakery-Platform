package com.se193262.subscriptionservice.feature.payment.service.impl;

import com.se193262.subscriptionservice.config.VnpayProperties;
import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.payment.dto.VnpayCheckoutResponse;
import com.se193262.subscriptionservice.feature.payment.dto.VnpayAttemptResponse;
import com.se193262.subscriptionservice.shared.dto.PageResult;
import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import com.se193262.subscriptionservice.feature.payment.repository.VnpayAttemptRepository;
import com.se193262.subscriptionservice.feature.payment.service.BakeryPaymentService;
import com.se193262.subscriptionservice.feature.payment.service.VnpayService;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import com.se193262.subscriptionservice.infrastructure.client.BakeryAccessClient;
import com.se193262.subscriptionservice.infrastructure.payment.VnpaySigner;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class VnpayServiceImpl implements VnpayService {
    private static final Logger log = LoggerFactory.getLogger(VnpayServiceImpl.class);
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("uuuuMMddHHmmss")
            .withResolverStyle(java.time.format.ResolverStyle.STRICT);
    private final VnpayAttemptRepository attempts;
    private final SubscriptionOrderRepository orders;
    private final BakeryPaymentService payments;
    private final BakeryAccessClient bakeryClient;
    private final TransactionTemplate transactions;
    private final VnpaySigner signer;
    private final VnpayProperties properties;

    public VnpayServiceImpl(VnpayAttemptRepository attempts, SubscriptionOrderRepository orders,
                           BakeryPaymentService payments, BakeryAccessClient bakeryClient,
                           TransactionTemplate transactions, VnpaySigner signer, VnpayProperties properties) {
        this.attempts = attempts;
        this.orders = orders;
        this.payments = payments;
        this.bakeryClient = bakeryClient;
        this.transactions = transactions;
        this.signer = signer;
        this.properties = properties;
    }

    @Override
    public VnpayCheckoutResponse checkout(UUID orderId, UUID userId, String ipAddress) {
        signer.requireConfigured();
        SubscriptionOrder order = orders.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Subscription order not found"));
        bakeryClient.requireMember(order.getBakeryId(), userId, true);
        bakeryClient.requireApprovedBakery(order.getBakeryId());
        return transactions.execute(transaction -> createAttempt(orderId, userId, ipAddress));
    }

    private VnpayCheckoutResponse createAttempt(UUID orderId, UUID userId, String ipAddress) {
        SubscriptionOrder order = orders.findLockedById(orderId).orElseThrow();
        Instant now = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        if (order.getStatus() != SubscriptionOrderStatus.PENDING_PAYMENT || !order.getExpiresAt().isAfter(now)) {
            throw new AppException(HttpStatus.CONFLICT, "Order is not awaiting payment");
        }
        if (!"VND".equals(order.getCurrency()) || order.getTotalAmount().signum() <= 0
                || order.getTotalAmount().stripTrailingZeros().scale() > 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "VNPay requires a positive whole VND amount");
        }
        VnpayAttempt attempt = attempts.findFirstByOrderIdAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(
                orderId, VnpayAttempt.Status.PENDING, now).orElseGet(() -> {
                    Instant expiry = now.plusSeconds(properties.timeoutMinutes() * 60L);
                    if (expiry.isAfter(order.getExpiresAt())) expiry = order.getExpiresAt();
                    return attempts.saveAndFlush(new VnpayAttempt(orderId, userId, order.getTotalAmount(),
                            now, expiry, ipAddress));
                });
        return new VnpayCheckoutResponse(attempt.getId(), orderId, paymentUrl(attempt), attempt.getExpiresAt());
    }

    private String paymentUrl(VnpayAttempt attempt) {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_Version", "2.1.0");
        fields.put("vnp_Command", "pay");
        fields.put("vnp_TmnCode", properties.tmnCode());
        fields.put("vnp_Amount", amount(attempt));
        fields.put("vnp_CurrCode", "VND");
        fields.put("vnp_TxnRef", attempt.getId().toString().replace("-", ""));
        fields.put("vnp_OrderInfo", "Subscription " + attempt.getOrderId());
        fields.put("vnp_OrderType", "other");
        fields.put("vnp_Locale", "vn");
        fields.put("vnp_ReturnUrl", properties.returnUrl());
        fields.put("vnp_IpAddr", attempt.getIpAddress());
        fields.put("vnp_CreateDate", DATE.format(attempt.getCreatedAt().atZone(ZONE)));
        fields.put("vnp_ExpireDate", DATE.format(attempt.getExpiresAt().atZone(ZONE)));
        return properties.paymentUrl() + "?" + signer.query(fields) + "&vnp_SecureHash=" + signer.sign(fields);
    }

    @Override
    public Map<String, String> ipn(Map<String, String> parameters) {
        try {
            signer.requireConfigured();
            if (!signer.verify(parameters) || !properties.tmnCode().equals(parameters.get("vnp_TmnCode"))) {
                return response("97", "Invalid signature");
            }
            UUID attemptId = reference(parameters.get("vnp_TxnRef"));
            VnpayAttempt initial = attempts.findById(attemptId).orElse(null);
            if (initial == null) return response("01", "Order not found");
            Map<String, String> result = transactions.execute(transaction -> settle(initial, parameters));
            if ("00".equals(result.get("RspCode")) || "02".equals(result.get("RspCode"))) {
                VnpayAttempt settled = attempts.findById(attemptId).orElseThrow();
                if (settled.getStatus() == VnpayAttempt.Status.SUCCEEDED) {
                    bakeryClient.notifySubscriptionApproved(orders.findById(settled.getOrderId()).orElseThrow().getBakeryId());
                }
            }
            return result;
        } catch (IllegalArgumentException exception) {
            return response("01", "Invalid reference");
        } catch (RuntimeException exception) {
            log.warn("VNPay IPN processing failed ({})",
                    exception.getClass().getSimpleName());
            return response("99", "Unable to process notification");
        }
    }

    private Map<String, String> settle(VnpayAttempt initial, Map<String, String> fields) {
        SubscriptionOrder order = orders.findLockedById(initial.getOrderId()).orElseThrow();
        VnpayAttempt attempt = attempts.findById(initial.getId()).orElseThrow();
        if (!amount(attempt).equals(fields.get("vnp_Amount"))) return response("04", "Invalid amount");
        if (attempt.getStatus() != VnpayAttempt.Status.PENDING) return response("02", "Already confirmed");
        String code = fields.get("vnp_ResponseCode");
        String status = fields.get("vnp_TransactionStatus");
        if (code == null || !code.matches("[0-9]{2}") || status == null || !status.matches("[0-9]{2}")) {
            return response("99", "Invalid result");
        }
        if (!"00".equals(code) || !"00".equals(status)) {
            attempt.finish(VnpayAttempt.Status.FAILED, null, code, status, null);
            return response("00", "Confirm success");
        }
        String transactionNo = fields.get("vnp_TransactionNo");
        if (transactionNo == null || !transactionNo.matches("[0-9]{1,30}") || "0".equals(transactionNo)) {
            return response("99", "Invalid transaction number");
        }
        Instant paidAt;
        try {
            paidAt = LocalDateTime.parse(fields.get("vnp_PayDate"), DATE).atZone(ZONE).toInstant();
        } catch (RuntimeException exception) {
            return response("99", "Invalid payment time");
        }
        boolean payable = order.getStatus() == SubscriptionOrderStatus.PENDING_PAYMENT
                || order.getStatus() == SubscriptionOrderStatus.EXPIRED;
        boolean withinWindow = !paidAt.isBefore(attempt.getCreatedAt()) && !paidAt.isAfter(attempt.getExpiresAt())
                && !paidAt.isAfter(Instant.now().plusSeconds(60));
        boolean matchesOrder = "VND".equals(order.getCurrency())
                && order.getTotalAmount().compareTo(attempt.getAmount()) == 0;
        if (!payable || !withinWindow || !matchesOrder) {
            attempt.finish(VnpayAttempt.Status.REVIEW_REQUIRED, transactionNo, code, status, paidAt);
            log.warn("VNPay payment requires reconciliation: attemptId={}", attempt.getId());
            return response("00", "Recorded for reconciliation");
        }
        payments.settleVnpay(order.getId(), attempt.getUserId(), transactionNo, attempt.getId());
        attempt.finish(VnpayAttempt.Status.SUCCEEDED, transactionNo, code, status, paidAt);
        return response("00", "Confirm success");
    }

    @Override
    public Map<String, String> returnResult(Map<String, String> parameters) {
        signer.requireConfigured();
        if (!signer.verify(parameters) || !properties.tmnCode().equals(parameters.get("vnp_TmnCode"))) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid VNPay signature");
        }
        UUID attemptId;
        try { attemptId = reference(parameters.get("vnp_TxnRef")); }
        catch (RuntimeException exception) { throw new AppException(HttpStatus.NOT_FOUND, "Payment attempt not found"); }
        VnpayAttempt attempt = attempts.findById(attemptId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Payment attempt not found"));
        if (!amount(attempt).equals(parameters.get("vnp_Amount"))) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid VNPay amount");
        }
        // ADR-006: a browser-delivered signed return reports provider fields but
        // cannot substitute for the independently delivered IPN settlement path.
        return Map.of("orderId", attempt.getOrderId().toString(), "attemptId", attempt.getId().toString(),
                "status", attempt.getStatus().name(), "responseCode", parameters.getOrDefault("vnp_ResponseCode", ""));
    }

    private static String amount(VnpayAttempt attempt) {
        return attempt.getAmount().movePointRight(2).toBigIntegerExact().toString();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<VnpayAttemptResponse> listAttempts(VnpayAttempt.Status status, int page, int size) {
        if (page < 1 || size < 1 || size > 100) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        }
        var pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        var result = status == null ? attempts.findAll(pageable) : attempts.findAllByStatus(status, pageable);
        return PageResult.fromPage(result.map(VnpayAttemptResponse::fromEntity));
    }

    private static UUID reference(String value) {
        if (value == null || !value.matches("[a-fA-F0-9]{32}")) throw new IllegalArgumentException("Invalid reference");
        return UUID.fromString(value.replaceFirst("(.{8})(.{4})(.{4})(.{4})(.{12})", "$1-$2-$3-$4-$5"));
    }

    private static Map<String, String> response(String code, String message) {
        return Map.of("RspCode", code, "Message", message);
    }
}
