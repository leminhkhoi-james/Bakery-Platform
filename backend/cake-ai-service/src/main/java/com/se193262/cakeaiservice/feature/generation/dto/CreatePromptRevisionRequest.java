package com.se193262.cakeaiservice.feature.generation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreatePromptRevisionRequest(
        @NotBlank @Size(max = 4000) String prompt,
        @Size(max = 2000) String negativePrompt,
        @Valid GenerationParameters generationParameters) {}
