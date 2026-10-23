package com.se193262.marketplaceservice.feature.cakerequest.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Map;

public record PatchCakeRequestRequest(Map<String, Object> changes) {
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public PatchCakeRequestRequest {}
}
