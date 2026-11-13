package com.se193262.identityservice.feature.address;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAddressJpaRepository extends JpaRepository<UserAddress, UUID> {
    boolean existsByUserIdAndIsDefaultTrue(UUID userId);
}
