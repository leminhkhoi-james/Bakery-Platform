package com.se193262.bakeryservice.feature.addon.service.impl;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.addon.dto.AddOnDto;
import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import com.se193262.bakeryservice.feature.addon.repository.AddOnRepository;
import com.se193262.bakeryservice.feature.addon.service.AddOnService;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.infrastructure.storage.BakeryImageStorage;
import com.se193262.bakeryservice.shared.dto.MediaResponse;
import org.springframework.web.multipart.MultipartFile;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AddOnServiceImpl implements AddOnService {

    private final AddOnRepository addOnRepository;
    private final BakeryRepository bakeryRepository;
    private final BakeryImageStorage imageStorage;

    public AddOnServiceImpl(AddOnRepository addOnRepository, BakeryRepository bakeryRepository,
            BakeryImageStorage imageStorage) {
        this.addOnRepository = addOnRepository;
        this.bakeryRepository = bakeryRepository;
        this.imageStorage = imageStorage;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddOnDto> list(UUID bakeryId) {
        findBakery(bakeryId);
        return addOnRepository.findAllByBakery_IdOrderByNameAsc(bakeryId)
                .stream().map(AddOnDto::fromEntity).toList();
    }

    @Override
    @Transactional
    public AddOnDto create(UUID bakeryId, AddOnDto request) {
        rejectId(request);
        Bakery bakery = findBakery(bakeryId);
        String name = required(request.name(), "name");
        String category = required(request.category(), "category");
        BigDecimal price = requiredPrice(request.price());
        AddOn addOn = new AddOn(bakery, name, category, price);
        addOn.update(null, request.description(), null, null, request.active());
        return AddOnDto.fromEntity(addOnRepository.saveAndFlush(addOn));
    }

    @Override
    @Transactional
    public AddOnDto update(UUID bakeryId, UUID addOnId, AddOnDto request) {
        rejectId(request);
        AddOn addOn = addOnRepository.findByIdAndBakery_Id(addOnId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Add-on not found"));
        addOn.update(request.name() == null ? null : required(request.name(), "name"),
                request.description(),
                request.category() == null ? null : required(request.category(), "category"),
                request.price() == null ? null : requiredPrice(request.price()), request.active());
        addOnRepository.flush();
        return AddOnDto.fromEntity(addOn);
    }

    @Override
    @Transactional
    public void delete(UUID bakeryId, UUID addOnId) {
        AddOn addOn = addOnRepository.findByIdAndBakery_Id(addOnId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Add-on not found"));
        addOn.disable();
        addOnRepository.flush();
    }

    @Override
    @Transactional
    public MediaResponse uploadImage(UUID bakeryId, UUID addOnId, MultipartFile file) {
        AddOn addOn = addOnRepository.findByIdAndBakery_Id(addOnId, bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Add-on not found"));
        BakeryImageStorage.StoredImage image = imageStorage.upload(file,
                "bakeries/" + bakeryId + "/add-ons/" + addOnId);
        String url = imageStorage.signedUrl(image.objectKey());
        String oldKey = addOn.getImageObjectKey();
        addOn.replaceImage(image.objectKey());
        addOnRepository.flush();
        imageStorage.afterCommitDelete(oldKey);
        return new MediaResponse(url, Instant.now().plus(imageStorage.urlExpiry()));
    }

    private Bakery findBakery(UUID bakeryId) {
        return bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
    }

    private static void rejectId(AddOnDto request) {
        if (request == null || request.id() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Request must not contain an ID");
        }
    }

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private static BigDecimal requiredPrice(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "price must be non-negative");
        }
        return value;
    }
}
