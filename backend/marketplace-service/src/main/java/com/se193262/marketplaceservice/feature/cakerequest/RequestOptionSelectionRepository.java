package com.se193262.marketplaceservice.feature.cakerequest;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface RequestOptionSelectionRepository
        extends JpaRepository<RequestOptionSelection, UUID>,
                JpaSpecificationExecutor<RequestOptionSelection> {
    java.util.List<RequestOptionSelection> findByCakeRequestIdOrderByIdAsc(UUID id);

    void deleteByCakeRequestId(UUID id);
}
