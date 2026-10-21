package com.se193262.subscriptionservice.feature.plan.service.impl;

import com.se193262.subscriptionservice.exception.AppException;
import com.se193262.subscriptionservice.feature.plan.dto.SubscriptionPlanDto;
import com.se193262.subscriptionservice.feature.plan.entity.PlanStatus;
import com.se193262.subscriptionservice.feature.plan.entity.SubscriptionPlan;
import com.se193262.subscriptionservice.feature.plan.repository.SubscriptionPlanRepository;
import com.se193262.subscriptionservice.feature.plan.service.SubscriptionPlanService;
import com.se193262.subscriptionservice.feature.subscriptionorder.repository.SubscriptionOrderRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionOrderRepository orderRepository;

    public SubscriptionPlanServiceImpl(SubscriptionPlanRepository planRepository,
                                       SubscriptionOrderRepository orderRepository) {
        this.planRepository = planRepository;
        this.orderRepository = orderRepository;
    }

    @Override @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> listPublic() {
        return planRepository.findAllByStatusOrderByMonthlyPriceAsc(PlanStatus.ACTIVE)
                .stream().map(SubscriptionPlanDto::fromEntity).toList();
    }

    @Override @Transactional(readOnly = true)
    public SubscriptionPlanDto getPublic(UUID planId) {
        return SubscriptionPlanDto.fromEntity(planRepository.findByIdAndStatus(planId, PlanStatus.ACTIVE)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Active plan not found")));
    }

    @Override @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> listAdmin() {
        return planRepository.findAll(Sort.by("code")).stream()
                .map(SubscriptionPlanDto::fromEntity).toList();
    }

    @Override @Transactional
    public SubscriptionPlanDto create(SubscriptionPlanDto request) {
        if (request == null || request.id() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "id is read-only");
        }
        String code = required(request.code(), "code").toUpperCase();
        if (planRepository.existsByCode(code)) {
            throw new AppException(HttpStatus.CONFLICT, "Plan code already exists");
        }
        String name = required(request.name(), "name");
        BigDecimal price = price(request.monthlyPrice());
        int period = period(request.billingPeriodMonths());
        String currency = currency(request.currency());
        validateFeatures(request.features());
        SubscriptionPlan plan = new SubscriptionPlan(code, name, price);
        plan.update(null, null, request.description(), null, currency, period,
                request.status(), request.features() == null ? Map.of() : request.features());
        return SubscriptionPlanDto.fromEntity(planRepository.saveAndFlush(plan));
    }

    @Override @Transactional
    public SubscriptionPlanDto update(UUID planId, SubscriptionPlanDto request) {
        if (request == null || request.id() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "id is read-only");
        }
        SubscriptionPlan plan = findPlan(planId);
        String code = request.code() == null ? null : required(request.code(), "code").toUpperCase();
        if (code != null && !code.equals(plan.getCode())) {
            if (orderRepository.existsByPlan_Id(planId)) {
                throw new AppException(HttpStatus.CONFLICT, "Plan code cannot change after an order exists");
            }
            if (planRepository.existsByCodeAndIdNot(code, planId)) {
                throw new AppException(HttpStatus.CONFLICT, "Plan code already exists");
            }
        }
        validateFeatures(request.features());
        plan.update(code, request.name() == null ? null : required(request.name(), "name"),
                request.description(), request.monthlyPrice() == null ? null : price(request.monthlyPrice()),
                request.currency() == null ? null : currency(request.currency()),
                request.billingPeriodMonths() == null ? null : period(request.billingPeriodMonths()),
                request.status(), request.features());
        planRepository.flush();
        return SubscriptionPlanDto.fromEntity(plan);
    }

    @Override @Transactional
    public SubscriptionPlanDto archive(UUID planId) {
        SubscriptionPlan plan = findPlan(planId);
        if (plan.getStatus() == PlanStatus.ARCHIVED) {
            throw new AppException(HttpStatus.CONFLICT, "Plan is already archived");
        }
        plan.archive();
        planRepository.flush();
        return SubscriptionPlanDto.fromEntity(plan);
    }

    private SubscriptionPlan findPlan(UUID planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Plan not found"));
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private static BigDecimal price(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "monthlyPrice must be non-negative");
        }
        return value;
    }

    private static int period(Integer value) {
        if (value == null || value <= 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "billingPeriodMonths must be positive");
        }
        return value;
    }

    private static String currency(String value) {
        if (value == null || !"VND".equalsIgnoreCase(value.trim())) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Only VND is supported");
        }
        return "VND";
    }

    private static void validateFeatures(Map<String, String> features) {
        if (features == null) return;
        for (Map.Entry<String, String> feature : features.entrySet()) {
            if (feature.getKey() == null || feature.getKey().isBlank() || feature.getKey().length() > 80
                    || feature.getValue() == null || feature.getValue().isBlank()
                    || feature.getValue().length() > 255) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid plan feature");
            }
        }
    }
}
