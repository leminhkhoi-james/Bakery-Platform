package com.se193262.cakeaiservice.feature.generation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;

public record CreateGenerationJobRequest(
        @NotNull UUID cakeRequestId,
        @NotBlank @Size(max = 4000) String prompt,
        @Size(max = 2000) String negativePrompt,
        @Valid GenerationParameters generationParameters) {}
