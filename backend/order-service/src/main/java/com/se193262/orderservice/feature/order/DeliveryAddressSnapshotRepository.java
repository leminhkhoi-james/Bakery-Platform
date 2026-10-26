package com.se193262.orderservice.feature.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DeliveryAddressSnapshotRepository extends JpaRepository<DeliveryAddressSnapshot, UUID> {
}