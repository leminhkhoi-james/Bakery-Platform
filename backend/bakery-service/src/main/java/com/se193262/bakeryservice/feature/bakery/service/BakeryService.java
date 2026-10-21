package com.se193262.bakeryservice.feature.bakery.service;

import com.se193262.bakeryservice.feature.bakery.dto.BakeryDto;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOperationsDto;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.shared.dto.PageResult;
import com.se193262.bakeryservice.shared.dto.MediaResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface BakeryService {

    BakeryDto create(BakeryDto request, UUID ownerUserId);

    BakeryDto get(UUID bakeryId);

    BakeryDto update(UUID bakeryId, BakeryDto request);

    BakeryOperationsDto replaceOperations(UUID bakeryId, BakeryOperationsDto request);

    BakeryDto submitForApproval(UUID bakeryId);

    BakeryDto changeStatus(UUID bakeryId, BakeryStatus status);

    PageResult<BakeryDto> listForAdmin(BakeryStatus status, String query, String city, int page, int size);

    MediaResponse uploadLogo(UUID bakeryId, MultipartFile file);

    MediaResponse uploadCover(UUID bakeryId, MultipartFile file);
}
