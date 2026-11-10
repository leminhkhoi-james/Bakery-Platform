package com.se193262.orderservice.infrastructure.scheduler;

import com.se193262.orderservice.feature.order.CustomerOrder;
import com.se193262.orderservice.feature.order.CustomerOrderRepository;
import com.se193262.orderservice.feature.order.OrderQueryPersistenceService;
import com.se193262.orderservice.feature.order.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class OrderAutoCompletionScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrderAutoCompletionScheduler.class);
    private static final UUID SYSTEM_ACTOR_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final CustomerOrderRepository orderRepository;
    private final OrderQueryPersistenceService persistenceService;
    private final Clock clock;
    private final Duration autoCompletionDelay;

    public OrderAutoCompletionScheduler(
            CustomerOrderRepository orderRepository,
            OrderQueryPersistenceService persistenceService,
            Clock clock,
            @Value("${order.auto-completion.delay-hours:24}") long delayHours) {
        this.orderRepository = orderRepository;
        this.persistenceService = persistenceService;
        this.clock = clock;
        this.autoCompletionDelay = Duration.ofHours(delayHours);
    }

    @Scheduled(fixedDelayString = "${order.auto-completion.interval-ms:60000}")
    public void autoCompleteDeliveredOrders() {
        Instant cutoff = clock.instant().minus(autoCompletionDelay);
        List<CustomerOrder> deliveringOrders =
                orderRepository.findAllByStatusAndUpdatedAtBefore(OrderStatus.DELIVERING, cutoff);
        for (CustomerOrder order : deliveringOrders) {
            try {
                persistenceService.transition(
                        order.getId(),
                        OrderStatus.COMPLETED,
                        "Hệ thống tự động hoàn tất sau " + autoCompletionDelay.toHours() + " giờ kể từ khi giao hàng",
                        SYSTEM_ACTOR_ID);
                log.info("Order {} ({}) automatically completed after {} hours in DELIVERING status",
                        order.getId(), order.getOrderNumber(), autoCompletionDelay.toHours());
            } catch (Exception ex) {
                log.error("Failed to auto-complete order {}: {}", order.getId(), ex.getMessage());
            }
        }
    }
}

