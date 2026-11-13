package com.se193262.marketplaceservice.feature.cakerequest;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface RequestStatusHistoryRepository
        extends JpaRepository<RequestStatusHistory, UUID>,
                JpaSpecificationExecutor<RequestStatusHistory> {
    java.util.List<RequestStatusHistory> findTop100ByCakeRequestIdOrderByChangedAtDesc(UUID id);

    void deleteByCakeRequestId(UUID id);
}
