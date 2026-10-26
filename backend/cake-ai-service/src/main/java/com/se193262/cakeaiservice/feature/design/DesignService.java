package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.cakeaiservice.feature.generation.GenerationData.Design;
import java.util.UUID;

public interface DesignService {
    GeneratedDesignResponse get(UUID id);
    GeneratedDesignResponse moderate(UUID id, String status);
    GeneratedDesignResponse response(Design design);
}
