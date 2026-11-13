package com.se193262.orderservice.feature.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderIdempotencyRepository extends JpaRepository<OrderIdempotencyRecord, UUID> {

    Optional<OrderIdempotencyRecord> findByOperationAndCustomerIdAndIdempotencyKey(
            String operation, UUID customerId, UUID idempotencyKey);
}