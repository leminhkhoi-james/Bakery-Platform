package com.se193262.orderservice.feature.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, UUID>, JpaSpecificationExecutor<CustomerOrder> {

    Page<CustomerOrder> findByCustomerId(UUID customerId, Pageable pageable);

    Page<CustomerOrder> findByBakeryId(UUID bakeryId, Pageable pageable);

    java.util.Optional<CustomerOrder> findByOfferId(UUID offerId);
}