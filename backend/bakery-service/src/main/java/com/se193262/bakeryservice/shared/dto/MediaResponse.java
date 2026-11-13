package com.se193262.bakeryservice.shared.dto;

import java.time.Instant;

public record MediaResponse(String url, Instant expiresAt) { }
