package com.se193262.orderservice.feature.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findAllByCustomerOrder_Id(UUID orderId);
}