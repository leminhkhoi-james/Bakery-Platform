package com.se193262.bakeryservice.feature.bakery.repository;

import com.se193262.bakeryservice.feature.bakery.entity.ServiceArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceAreaRepository extends JpaRepository<ServiceArea, UUID> {

    List<ServiceArea> findAllByBakery_Id(UUID bakeryId);
}
