package com.se193262.marketplaceservice.feature.cakerequest;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface CakeRequestRepository
        extends JpaRepository<CakeRequest, UUID>, JpaSpecificationExecutor<CakeRequest> {
    java.util.List<CakeRequest> findTop100ByStatusAndNeededAtBefore(
            RequestStatus status, java.time.Instant now);
}
