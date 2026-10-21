package com.se193262.bakeryservice.feature.bakery.service;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOperationsDto;

import java.util.UUID;

public interface BakeryService {

    BakeryDto create(BakeryDto request, UUID ownerUserId);

    BakeryDto get(UUID bakeryId);

    BakeryDto update(UUID bakeryId, BakeryDto request);

    BakeryOperationsDto replaceOperations(UUID bakeryId, BakeryOperationsDto request);
}
