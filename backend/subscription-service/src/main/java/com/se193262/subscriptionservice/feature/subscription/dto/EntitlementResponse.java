package com.se193262.subscriptionservice.feature.subscription.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record EntitlementResponse(UUID bakeryId, boolean active, String planCode,
                                  Instant periodEnd, Map<String, String> features) { }
