package com.se193262.bakeryservice.feature.bakery.repository;

import com.se193262.bakeryservice.feature.bakery.entity.BusinessHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BusinessHourRepository extends JpaRepository<BusinessHour, UUID> {

    List<BusinessHour> findAllByBakery_Id(UUID bakeryId);
}
