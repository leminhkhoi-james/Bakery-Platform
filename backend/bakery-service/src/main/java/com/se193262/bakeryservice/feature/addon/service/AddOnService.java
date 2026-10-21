package com.se193262.bakeryservice.feature.addon.service;

import com.se193262.bakeryservice.feature.addon.dto.AddOnDto;

import java.util.List;
import java.util.UUID;

public interface AddOnService {

    List<AddOnDto> list(UUID bakeryId);

    AddOnDto create(UUID bakeryId, AddOnDto request);

    AddOnDto update(UUID bakeryId, UUID addOnId, AddOnDto request);

    void delete(UUID bakeryId, UUID addOnId);
}
