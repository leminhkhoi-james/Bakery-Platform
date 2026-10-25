package com.se193262.bakeryservice.feature.product.service;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.addon.dto.PublicAddOnResponse;
import com.se193262.bakeryservice.feature.addon.repository.AddOnRepository;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryAddress;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.repository.BakeryAddressRepository;
import com.se193262.bakeryservice.feature.category.dto.ProductCategoryDto;
import com.se193262.bakeryservice.feature.product.dto.ProductDto;
import com.se193262.bakeryservice.feature.product.dto.ProductImageResponse;
import com.se193262.bakeryservice.feature.product.dto.ProductOptionsDto;
import com.se193262.bakeryservice.feature.product.dto.PublicProductResponse;
import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.repository.ProductImageRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionGroupRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionValueRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductRepository;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PublicProductService {
    private final ProductRepository productRepository;
    private final BakeryAddressRepository addressRepository;
    private final ProductImageRepository imageRepository;
    private final ProductOptionGroupRepository groupRepository;
    private final ProductOptionValueRepository valueRepository;
    private final AddOnRepository addOnRepository;
    private final SubscriptionEntitlementClient entitlementClient;
    private final BakeryImageStorage imageStorage;

    public PublicProductService(ProductRepository productRepository,
            BakeryAddressRepository addressRepository, ProductImageRepository imageRepository,
            ProductOptionGroupRepository groupRepository, ProductOptionValueRepository valueRepository,
            AddOnRepository addOnRepository, SubscriptionEntitlementClient entitlementClient,
            BakeryImageStorage imageStorage) {
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
        this.imageRepository = imageRepository;
        this.groupRepository = groupRepository;
        this.valueRepository = valueRepository;
        this.addOnRepository = addOnRepository;
        this.entitlementClient = entitlementClient;
        this.imageStorage = imageStorage;
    }

    @Transactional(readOnly = true)
    public PageResult<PublicProductResponse> list(String query, UUID bakeryId, UUID categoryId,
            String city, Boolean customizable, BigDecimal minPrice, BigDecimal maxPrice,
            int page, int size, String sort) {
        if (page < 1 || size < 1 || size > 100 || minPrice != null && minPrice.signum() < 0
                || maxPrice != null && maxPrice.signum() < 0
                || minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid product filters or pagination");
        }
        Sort ordering = AllowedSort.parse(sort, java.util.Set.of("createdAt", "name", "basePrice", "id"));
        long offset = (long) (page - 1) * size;
        long count = 0;
        List<PublicProductResponse> result = new ArrayList<>();
        Map<UUID, Boolean> entitlement = new HashMap<>();
        Map<UUID, Boolean> cityMatch = new HashMap<>();
        int chunk = 0;
        Page<Product> candidates;
        do {
            candidates = productRepository.findPublicCandidates(ProductStatus.PUBLISHED,
                    BakeryStatus.ACTIVE, bakeryId, categoryId, customizable, minPrice, maxPrice,
                    query == null ? "" : query.trim(),
                    PageRequest.of(chunk++, 100, ordering));
            for (Product product : candidates.getContent()) {
                UUID candidateBakeryId = product.getBakery().getId();
                boolean matchesCity = city == null || city.isBlank()
                        || cityMatch.computeIfAbsent(candidateBakeryId, id ->
                        addressRepository.findAllByBakery_Id(id).stream()
                                .map(BakeryAddress::getCity).anyMatch(value -> value.equalsIgnoreCase(city.trim())));
                if (!matchesCity || !entitlement.computeIfAbsent(candidateBakeryId,
                        entitlementClient::hasActiveSubscription)) continue;
                if (count >= offset && result.size() < size) result.add(toResponse(product, false));
                count++;
            }
        } while (candidates.hasNext());
        return new PageResult<>(new PageResult.Meta(page, size,
                (int) ((count + size - 1) / size), count), result);
    }

    @Transactional(readOnly = true)
    public PublicProductResponse get(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (product.getStatus() != ProductStatus.PUBLISHED
                || product.getBakery().getStatus() != BakeryStatus.ACTIVE
                || !entitlementClient.hasActiveSubscription(product.getBakery().getId())) {
            throw new AppException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return toResponse(product, true);
    }

    private PublicProductResponse toResponse(Product product, boolean detail) {
        UUID bakeryId = product.getBakery().getId();
        List<ProductImageResponse> images = imageRepository.findAllByProduct_IdOrderByDisplayOrderAsc(product.getId())
                .stream().map(image -> new ProductImageResponse(image.getId(),
                        imageStorage.signedUrl(image.getObjectKey()),
                        Instant.now().plus(imageStorage.urlExpiry()), image.getMediaType(),
                        image.getDisplayOrder(), image.isPrimary())).toList();
        ProductOptionsDto options = new ProductOptionsDto(List.of());
        List<PublicAddOnResponse> addOns = List.of();
        if (detail) {
            var values = valueRepository.findAllByOptionGroup_Product_Id(product.getId());
            options = new ProductOptionsDto(groupRepository.findAllByProduct_IdOrderByDisplayOrderAsc(product.getId())
                    .stream().map(group -> ProductOptionsDto.Group.fromEntity(group,
                            values.stream().filter(value -> value.getOptionGroup().getId().equals(group.getId())
                                    && value.isActive()).toList())).toList());
            addOns = addOnRepository.findAllByBakery_IdOrderByNameAsc(bakeryId).stream()
                    .filter(addOn -> addOn.isActive())
                    .map(addOn -> new PublicAddOnResponse(addOn.getId(), addOn.getName(),
                            addOn.getDescription(), addOn.getCategory(), addOn.getPrice(),
                            addOn.getImageObjectKey() == null ? null
                                    : imageStorage.signedUrl(addOn.getImageObjectKey())))
                    .toList();
        }
        return new PublicProductResponse(ProductDto.fromEntity(product), bakeryId,
                product.getBakery().getName(), product.getCategory() == null ? null
                : ProductCategoryDto.fromEntity(product.getCategory()), images, options, addOns);
    }
}
