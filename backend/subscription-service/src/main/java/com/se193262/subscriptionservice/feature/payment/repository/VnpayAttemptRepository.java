package com.se193262.subscriptionservice.feature.payment.repository;

import com.se193262.subscriptionservice.feature.payment.entity.VnpayAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface VnpayAttemptRepository extends JpaRepository<VnpayAttempt, UUID> {
    org.springframework.data.domain.Page<VnpayAttempt> findAllByStatus(VnpayAttempt.Status status,
            org.springframework.data.domain.Pageable pageable);
    Optional<VnpayAttempt> findFirstByOrderIdAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(
            UUID orderId, VnpayAttempt.Status status, Instant now);
}
