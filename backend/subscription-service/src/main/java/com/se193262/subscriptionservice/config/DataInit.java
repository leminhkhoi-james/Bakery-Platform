package com.se193262.subscriptionservice.config;

import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import com.se193262.subscriptionservice.feature.payment.entity.PaymentStatus;
import com.se193262.subscriptionservice.feature.payment.repository.BakeryPaymentRepository;
import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.subscription.entity.BakerySubscription;
import com.se193262.subscriptionservice.feature.subscription.entity.SubscriptionStatus;
import com.se193262.subscriptionservice.feature.subscription.repository.BakerySubscriptionRepository;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrder;
import com.se193262.subscriptionservice.feature.subscriptionorder.entity.SubscriptionOrderStatus;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInit implements CommandLineRunner {
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionOrderRepository orderRepository;
    private final BakeryPaymentRepository paymentRepository;
    private final BakerySubscriptionRepository subscriptionRepository;

    public DataInit(SubscriptionPlanRepository planRepository, SubscriptionOrderRepository orderRepository,
            BakeryPaymentRepository paymentRepository, BakerySubscriptionRepository subscriptionRepository) {
        this.planRepository = planRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        SubscriptionPlan[] plans = {plan(1, "BASIC", "Cơ bản", 199000, "20", "50"),
                plan(2, "PRO", "Chuyên nghiệp", 499000, "100", "300"),
                plan(3, "PREMIUM", "Cao cấp", 999000, "-1", "-1")};
        Instant now = Instant.now();
        for (int number : new int[]{1, 2, 3, 5, 6}) {
            int bakery = number == 6 ? 1 : number;
            int owner = bakery <= 3 ? 20 + bakery : 27 + bakery;
            boolean completed = number <= 3;
            Instant created = now;
            SubscriptionOrder order = seedOrder(number, plans[(bakery - 1) % 3], created);
            if (number != 6) seedPayment(number, order, owner, completed);
            if (completed) seedSubscription(number, order);
        }
        LoggerFactory.getLogger(DataInit.class).info("DataInit ready: seed subscriptions and manual payments; no VNPay requests");
    }

    private SubscriptionOrder seedOrder(int number, SubscriptionPlan plan, Instant created) {
        var existing = orderRepository.findById(id(30, number));
        if (existing.isPresent()) {
            SubscriptionOrder order = existing.get();
            if (order.getOrderNumber().equals("SUB-DEMO-%03d".formatted(number))) order.setOrderNumber("SUB-260%03d".formatted(number));
            return order;
        }
        int bakery = number == 6 ? 1 : number;
        SubscriptionOrder order = new SubscriptionOrder();
        order.setId(id(30, number));
        order.setOrderNumber("SUB-260%03d".formatted(number));
        order.setBakeryId(id(10, bakery));
        order.setPlan(plan);
        order.setRequestedByUserId(id(1, bakery <= 3 ? 20 + bakery : 27 + bakery));
        order.setPlanNameSnapshot(plan.getName());
        order.setPlanCodeSnapshot(plan.getCode());
        order.setFeaturesSnapshot(Map.copyOf(plan.getFeatures()));
        order.setBillingPeriodMonths(plan.getBillingPeriodMonths());
        order.setTotalAmount(plan.getMonthlyPrice().multiply(BigDecimal.valueOf(plan.getBillingPeriodMonths())));
        order.setCurrency(plan.getCurrency());
        order.setStatus(number <= 3 ? SubscriptionOrderStatus.COMPLETED
                : number == 5 ? SubscriptionOrderStatus.PAYMENT_REVIEW : SubscriptionOrderStatus.PENDING_PAYMENT);
        order.setExpiresAt(created.plus(1, ChronoUnit.DAYS));
        order.setCreatedAt(created);
        order.setUpdatedAt(created);
        order.setCompletedAt(number <= 3 ? created : null);
        return orderRepository.save(order);
    }

    private void seedPayment(int number, SubscriptionOrder order, int owner, boolean completed) {
        var existing = paymentRepository.findById(id(31, number));
        if (existing.isPresent()) {
            BakeryPayment payment = existing.get();
            if (("DEMO-REFERENCE-" + number).equals(payment.getPaymentReference())) payment.setPaymentReference("CK-SUB-260%03d".formatted(number));
            if ("Dữ liệu DataInit; không có giao dịch ngân hàng thật.".equals(payment.getReviewNote())) payment.setReviewNote(completed ? "Chứng từ khớp thông tin đăng ký gói." : null);
            return;
        }
        BakeryPayment payment = new BakeryPayment();
        payment.setId(id(31, number));
        payment.setOrder(order);
        payment.setSubmittedByUserId(id(1, owner));
        payment.setPaymentMethod("BANK_TRANSFER");
        payment.setPaymentReference("CK-SUB-260%03d".formatted(number));
        payment.setAmount(order.getTotalAmount());
        payment.setCurrency(order.getCurrency());
        payment.setStatus(completed ? PaymentStatus.APPROVED : PaymentStatus.SUBMITTED);
        payment.setReviewedByAdminId(completed ? id(1, 1) : null);
        payment.setReviewNote(completed ? "Chứng từ khớp thông tin đăng ký gói." : null);
        payment.setSubmittedAt(order.getCreatedAt());
        payment.setReviewedAt(order.getCompletedAt());
        payment.setVerificationSource("MANUAL");
        paymentRepository.save(payment);
    }

    private void seedSubscription(int number, SubscriptionOrder order) {
        if (subscriptionRepository.existsById(id(32, number))
                || subscriptionRepository.existsByBakeryIdAndStatus(order.getBakeryId(), SubscriptionStatus.ACTIVE)) return;
        Instant start = order.getCompletedAt();
        BakerySubscription subscription = new BakerySubscription();
        subscription.setId(id(32, number));
        subscription.setBakeryId(order.getBakeryId());
        subscription.setPlan(order.getPlan());
        subscription.setSourceOrder(order);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setPeriodStart(start);
        subscription.setPeriodEnd(start.plus(30L * order.getBillingPeriodMonths(), ChronoUnit.DAYS));
        subscription.setActivatedAt(start);
        subscription.setFeaturesSnapshot(Map.copyOf(order.getFeaturesSnapshot()));
        subscription.setCreatedAt(start);
        subscription.setUpdatedAt(start);
        subscriptionRepository.save(subscription);
    }

    private SubscriptionPlan plan(int number, String code, String name, int price, String products, String offers) {
        var existing = planRepository.findByCode(code);
        if (existing.isPresent()) return existing.get();
        UUID planId = UUID.fromString("00000000-0000-0000-0000-%012d".formatted(100 + number));
        if (planRepository.existsById(planId)) throw new IllegalStateException("Demo plan ID already belongs to another code");
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setId(planId);
        plan.setCode(code);
        plan.setName(name);
        plan.setMonthlyPrice(BigDecimal.valueOf(price));
        plan.setCurrency("VND");
        plan.setBillingPeriodMonths(1);
        plan.setStatus(PlanStatus.ACTIVE);
        plan.setFeatures(Map.of("MAX_PRODUCTS", products, "MAX_MONTHLY_OFFERS", offers,
                "FEATURED_LISTING", String.valueOf(number == 3)));
        plan.setCreatedAt(Instant.now());
        plan.setUpdatedAt(Instant.now());
        return planRepository.save(plan);
    }

    private static UUID id(int kind, int number) {
        return UUID.fromString("a110%04d-0000-4000-8000-%012d".formatted(kind, number));
    }
}
