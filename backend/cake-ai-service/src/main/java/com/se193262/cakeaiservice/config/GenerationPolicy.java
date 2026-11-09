package com.se193262.cakeaiservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("cake-ai.policy")
public record GenerationPolicy(
        @DefaultValue("false") boolean enabled,
        @DefaultValue("false") boolean requireAdminReview,
        @DefaultValue("3") int dailyExecutionsPerCustomer,
        @DefaultValue("1") int activeExecutionsPerCustomer,
        @DefaultValue("9") int dailyProviderRequests,
        @DefaultValue("4096") int imageOutputTokens,
        @DefaultValue("1024") int moderationOutputTokens,
        @DefaultValue("false") boolean cleanupEnabled,
        @DefaultValue("4") int maxDesignsPerExecution) {
    public GenerationPolicy {
        if (maxDesignsPerExecution < 1 || maxDesignsPerExecution > 4 || dailyExecutionsPerCustomer < 1 || activeExecutionsPerCustomer < 1 || dailyProviderRequests < 1
                || imageOutputTokens < 1120 || imageOutputTokens > 4096
                || moderationOutputTokens < 128 || moderationOutputTokens > 1024)
            throw new IllegalArgumentException("Invalid Cake AI quota or output token limits");
    }
    public static GenerationPolicy defaults() { return new GenerationPolicy(false, false, 3, 1, 9, 4096, 1024, false, 4); }
}
