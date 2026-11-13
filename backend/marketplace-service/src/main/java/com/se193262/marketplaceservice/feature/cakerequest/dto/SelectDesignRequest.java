package com.se193262.marketplaceservice.feature.cakerequest.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SelectDesignRequest(@NotNull UUID generatedDesignId) {}
