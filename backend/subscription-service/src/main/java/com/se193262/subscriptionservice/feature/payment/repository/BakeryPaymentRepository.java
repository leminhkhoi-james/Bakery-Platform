package com.se193262.subscriptionservice.feature.payment.repository;

import com.se193262.subscriptionservice.feature.payment.entity.BakeryPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BakeryPaymentRepository extends JpaRepository<BakeryPayment, UUID>,
        JpaSpecificationExecutor<BakeryPayment> {
    List<BakeryPayment> findAllByOrder_IdOrderBySubmittedAtAsc(UUID orderId);
    Optional<BakeryPayment> findByPaymentReference(String paymentReference);
    Optional<BakeryPayment> findByIdempotencyKeyHash(String idempotencyKeyHash);
}
