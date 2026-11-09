package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.cakeaiservice.feature.generation.GenerationData.Design;
import java.util.*;

public interface DesignService {
    record DesignPage(List<GeneratedDesignResponse> content, int page, int size, long totalElements, int totalPages) {}
    GeneratedDesignResponse get(UUID id);
    default GeneratedDesignResponse moderate(UUID id, String status) { return moderate(id, status, null); }
    GeneratedDesignResponse moderate(UUID id, String status, String reason);
    GeneratedDesignResponse response(Design design);
    DesignPage pending(String status, int page, int size);
}
