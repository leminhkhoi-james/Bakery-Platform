package com.se193262.orderservice.feature.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, UUID> {

    List<OrderStatusHistory> findAllByCustomerOrder_IdOrderByChangedAtAsc(UUID orderId);
}