package com.se193262.marketplaceservice.shared.dto;

import jakarta.validation.constraints.Size;

public record ReasonRequest(@Size(max = 2000) String reason) {}
