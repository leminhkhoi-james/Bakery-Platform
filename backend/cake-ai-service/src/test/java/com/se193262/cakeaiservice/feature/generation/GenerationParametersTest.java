package com.se193262.cakeaiservice.feature.generation;

import static org.junit.jupiter.api.Assertions.*;
import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import com.se193262.platform.exception.BusinessException;
import org.junit.jupiter.api.*;

class GenerationParametersTest {
    @Test @DisplayName("Missing generation parameters default to one square image")
    void normalized_missingValues_usesDefaults() {
        assertEquals(new GenerationParameters("1:1", 1), new GenerationParameters(null, null).normalized());
    }
    @Test @DisplayName("Unsupported aspect ratio and image count are rejected")
    void normalized_unsupportedValues_rejects() {
        assertThrows(BusinessException.class, () -> new GenerationParameters("16:9", 1).normalized());
        assertThrows(BusinessException.class, () -> new GenerationParameters("1:1", 0).normalized());
        assertThrows(BusinessException.class, () -> new GenerationParameters("1:1", 5).normalized());
    }
}
