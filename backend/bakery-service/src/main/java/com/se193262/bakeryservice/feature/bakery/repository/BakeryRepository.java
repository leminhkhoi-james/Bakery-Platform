package com.se193262.bakeryservice.feature.bakery.repository;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BakeryRepository extends JpaRepository<Bakery, UUID> {
}
