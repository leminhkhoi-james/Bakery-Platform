package com.se193262.bakeryservice.feature.bakery.repository;

import com.se193262.bakeryservice.feature.bakery.entity.BakeryAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BakeryAddressRepository extends JpaRepository<BakeryAddress, UUID> {

    List<BakeryAddress> findAllByBakery_Id(UUID bakeryId);
}
