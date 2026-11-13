package com.se193262.cakeaiservice.feature.generation.dto;

import com.se193262.platform.exception.BusinessException;

public record GenerationParameters(String aspectRatio, Integer numberOfDesigns) {
    public GenerationParameters normalized() {
        String ratio = aspectRatio == null ? "1:1" : aspectRatio;
        int count = numberOfDesigns == null ? 1 : numberOfDesigns;
        if (!java.util.Set.of("1:1", "4:3", "3:4").contains(ratio) || count < 1 || count > 4)
            throw BusinessException.invalid("Unsupported generation parameters");
        return new GenerationParameters(ratio, count);
    }
}
