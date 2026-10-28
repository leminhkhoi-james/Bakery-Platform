package com.se193262.bakeryservice.feature.bakery.service;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.bakery.dto.BakeryOperationsDto;
import com.se193262.bakeryservice.feature.bakery.dto.PublicBakeryResponse;
import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryAddress;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryAddressRepository;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryRepository;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import com.se193262.bakeryservice.infrastructure.storage.BakeryImageStorage;
import com.se193262.bakeryservice.shared.dto.PageResult;
import com.se193262.bakeryservice.shared.AllowedSort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PublicBakeryService {
    private final BakeryRepository bakeryRepository;
    private final BakeryAddressRepository addressRepository;
    private final BakeryService bakeryService;
    private final SubscriptionEntitlementClient entitlementClient;
    private final BakeryImageStorage imageStorage;

    public PublicBakeryService(BakeryRepository bakeryRepository,
            BakeryAddressRepository addressRepository, BakeryService bakeryService,
            SubscriptionEntitlementClient entitlementClient, BakeryImageStorage imageStorage) {
        this.bakeryRepository = bakeryRepository;
        this.addressRepository = addressRepository;
        this.bakeryService = bakeryService;
        this.entitlementClient = entitlementClient;
        this.imageStorage = imageStorage;
    }

    @Transactional(readOnly = true)
    public PageResult<PublicBakeryResponse> list(String query, String city, String district,
            int page, int size, String sort) {
        if (page < 1 || size < 1 || size > 100) {
            throw new AppException(HttpStatus.BAD_REQUEST, "page must be >= 1 and size must be 1..100");
        }
        Sort ordering = AllowedSort.parse(sort, java.util.Set.of("name", "createdAt", "id"));
        long offset = (long) (page - 1) * size;
        long count = 0;
        List<PublicBakeryResponse> result = new ArrayList<>();
        int chunk = 0;
        Page<Bakery> candidates;
        do {
            candidates = bakeryRepository.search(BakeryStatus.ACTIVE,
                    query == null ? "" : query.trim(),
                    PageRequest.of(chunk++, 100, ordering));
            for (Bakery bakery : candidates.getContent()) {
                List<BakeryAddress> addresses = addressRepository.findAllByBakery_Id(bakery.getId());
                if (!matchesAddress(addresses, city, district)
                        || !entitlementClient.hasActiveSubscription(bakery.getId())) continue;
                if (count >= offset && result.size() < size) result.add(toResponse(bakery));
                count++;
            }
        } while (candidates.hasNext());
        return new PageResult<>(new PageResult.Meta(page, size,
                (int) ((count + size - 1) / size), count), result);
    }

    @Transactional(readOnly = true)
    public PublicBakeryResponse get(UUID bakeryId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bakery not found"));
        if (bakery.getStatus() != BakeryStatus.ACTIVE
                || !entitlementClient.hasActiveSubscription(bakeryId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bakery not found");
        }
        return toResponse(bakery);
    }

    private boolean matchesAddress(List<BakeryAddress> addresses, String city, String district) {
        if ((city == null || city.isBlank()) && (district == null || district.isBlank())) return true;
        return addresses.stream().anyMatch(address ->
                (city == null || city.isBlank() || address.getCity().equalsIgnoreCase(city.trim()))
                        && (district == null || district.isBlank()
                        || address.getDistrict().equalsIgnoreCase(district.trim())));
    }

    private PublicBakeryResponse toResponse(Bakery bakery) {
        BakeryOperationsDto operations = bakeryService.get(bakery.getId()).operations();
        BakeryOperationsDto.Address primary = operations.addresses().stream()
                .filter(address -> Boolean.TRUE.equals(address.isPrimary())).findFirst().orElse(null);
        return new PublicBakeryResponse(bakery.getId(), bakery.getName(), bakery.getDescription(),
                bakery.getLogoObjectKey() == null ? null : imageStorage.signedUrl(bakery.getLogoObjectKey()),
                bakery.getCoverObjectKey() == null ? null : imageStorage.signedUrl(bakery.getCoverObjectKey()),
                primary, operations);
    }
}
