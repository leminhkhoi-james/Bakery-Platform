package com.se193262.marketplaceservice.feature.cakerequest;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface CakePreferenceRepository
        extends JpaRepository<CakePreference, UUID>, JpaSpecificationExecutor<CakePreference> {}
