package com.se193262.marketplaceservice.feature.offer.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Map;

public record PatchOfferRequest(Map<String, Object> changes) {
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public PatchOfferRequest {}
}
