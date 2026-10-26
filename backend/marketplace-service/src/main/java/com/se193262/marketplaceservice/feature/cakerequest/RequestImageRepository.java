package com.se193262.marketplaceservice.feature.cakerequest;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface RequestImageRepository
        extends JpaRepository<RequestImage, UUID>, JpaSpecificationExecutor<RequestImage> {
    java.util.List<RequestImage> findTop100ByCakeRequestIdOrderByDisplayOrderAsc(UUID id);

    boolean existsByObjectKey(String key);

    void deleteByCakeRequestId(UUID id);
}
