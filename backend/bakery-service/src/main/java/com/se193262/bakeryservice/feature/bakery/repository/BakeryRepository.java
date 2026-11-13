package com.se193262.bakeryservice.feature.bakery.repository;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;

import java.util.UUID;

public interface BakeryRepository extends JpaRepository<Bakery, UUID> {
    @Query("select b from Bakery b where (:status is null or b.status = :status) "
            + "and lower(b.name) like lower(concat('%', :query, '%'))")
    Page<Bakery> search(@Param("status") BakeryStatus status, @Param("query") String query,
                        Pageable pageable);
}
