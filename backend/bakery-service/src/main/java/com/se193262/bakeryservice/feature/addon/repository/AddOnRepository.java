package com.se193262.bakeryservice.feature.addon.repository;

import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AddOnRepository extends JpaRepository<AddOn, UUID> {

    List<AddOn> findAllByBakery_IdOrderByNameAsc(UUID bakeryId);

    Optional<AddOn> findByIdAndBakery_Id(UUID addOnId, UUID bakeryId);
}
