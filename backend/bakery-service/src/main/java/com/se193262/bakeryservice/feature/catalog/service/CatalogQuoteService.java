package com.se193262.bakeryservice.feature.catalog.service;

import com.se193262.bakeryservice.exception.AppException;
import com.se193262.bakeryservice.feature.addon.entity.AddOn;
import com.se193262.bakeryservice.feature.addon.repository.AddOnRepository;
import com.se193262.bakeryservice.feature.bakery.entity.BakeryStatus;
import com.se193262.bakeryservice.feature.bakery.entity.ServiceArea;
import com.se193262.bakeryservice.feature.bakery.repository.ServiceAreaRepository;
import com.se193262.bakeryservice.feature.catalog.dto.CatalogQuoteRequest;
import com.se193262.bakeryservice.feature.catalog.dto.CatalogQuoteResponse;
import com.se193262.bakeryservice.feature.product.entity.Product;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionGroup;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionValue;
import com.se193262.bakeryservice.feature.product.entity.ProductStatus;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionGroupRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductOptionValueRepository;
import com.se193262.bakeryservice.feature.product.repository.ProductRepository;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CatalogQuoteService {
    private final ProductRepository productRepository;
    private final ProductOptionGroupRepository groupRepository;
    private final ProductOptionValueRepository valueRepository;
    private final AddOnRepository addOnRepository;
    private final ServiceAreaRepository areaRepository;
    private final SubscriptionEntitlementClient entitlementClient;

    public CatalogQuoteService(ProductRepository productRepository,
            ProductOptionGroupRepository groupRepository, ProductOptionValueRepository valueRepository,
            AddOnRepository addOnRepository, ServiceAreaRepository areaRepository,
            SubscriptionEntitlementClient entitlementClient) {
        this.productRepository = productRepository;
        this.groupRepository = groupRepository;
        this.valueRepository = valueRepository;
        this.addOnRepository = addOnRepository;
        this.areaRepository = areaRepository;
        this.entitlementClient = entitlementClient;
    }

    @Transactional(readOnly = true)
    public CatalogQuoteResponse quote(CatalogQuoteRequest request) {
        if (request == null || request.bakeryId() == null || request.productId() == null
                || request.quantity() < 1 || request.quantity() > 100
                || request.deliveryCity() == null || request.deliveryCity().isBlank()
                || request.deliveryDistrict() == null || request.deliveryDistrict().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid quote request");
        }
        Product product = productRepository.findByIdAndBakery_Id(request.productId(), request.bakeryId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (product.getStatus() != ProductStatus.PUBLISHED
                || product.getBakery().getStatus() != BakeryStatus.ACTIVE) {
            throw new AppException(HttpStatus.CONFLICT, "Product or bakery is not public");
        }
        if (!entitlementClient.hasActiveSubscription(request.bakeryId())) {
            throw new AppException(HttpStatus.CONFLICT, "Bakery subscription is inactive");
        }
        ServiceArea area = areaRepository.findAllByBakery_Id(request.bakeryId()).stream()
                .filter(candidate -> candidate.isActive()
                        && candidate.getCity().equalsIgnoreCase(request.deliveryCity().trim())
                        && candidate.getDistrict().equalsIgnoreCase(request.deliveryDistrict().trim()))
                .findFirst().orElseThrow(() -> new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Delivery area is not served"));

        Map<UUID, CatalogQuoteRequest.OptionSelection> selections = new HashMap<>();
        for (var selection : request.optionSelections() == null ? List.<CatalogQuoteRequest.OptionSelection>of()
                : request.optionSelections()) {
            if (selection == null || selection.optionGroupId() == null || selection.optionValueIds() == null
                    || selections.putIfAbsent(selection.optionGroupId(), selection) != null) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Duplicate or invalid option group");
            }
        }
        Map<UUID, List<ProductOptionValue>> valuesByGroup = new HashMap<>();
        for (ProductOptionValue value : valueRepository.findAllByOptionGroup_Product_Id(product.getId())) {
            valuesByGroup.computeIfAbsent(value.getOptionGroup().getId(), ignored -> new ArrayList<>()).add(value);
        }
        BigDecimal cakeUnitPrice = product.getBasePrice();
        List<Map<String, Object>> optionSnapshots = new ArrayList<>();
        for (ProductOptionGroup group : groupRepository.findAllByProduct_IdOrderByDisplayOrderAsc(product.getId())) {
            CatalogQuoteRequest.OptionSelection selection = selections.remove(group.getId());
            List<UUID> selectedIds = selection == null ? List.of() : selection.optionValueIds();
            if (selectedIds.size() < group.getMinimumSelections()
                    || selectedIds.size() > group.getMaximumSelections()
                    || (group.isRequired() && selectedIds.isEmpty())) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Option selection count is invalid");
            }
            Set<UUID> unique = new HashSet<>(selectedIds);
            if (unique.size() != selectedIds.size()) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Duplicate option value");
            }
            List<Map<String, Object>> valueSnapshots = new ArrayList<>();
            for (UUID selectedId : selectedIds) {
                ProductOptionValue value = valuesByGroup.getOrDefault(group.getId(), List.of()).stream()
                        .filter(candidate -> candidate.getId().equals(selectedId) && candidate.isActive())
                        .findFirst().orElseThrow(() -> new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                                "Option value is unavailable"));
                cakeUnitPrice = cakeUnitPrice.add(value.getPriceAdjustment());
                valueSnapshots.add(Map.of("id", value.getId().toString(), "name", value.getName(),
                        "priceAdjustment", value.getPriceAdjustment()));
            }
            if (!valueSnapshots.isEmpty()) {
                optionSnapshots.add(Map.of("groupId", group.getId().toString(),
                        "groupName", group.getName(), "values", valueSnapshots));
            }
        }
        if (!selections.isEmpty() || cakeUnitPrice.signum() < 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid product option selection");
        }

        List<CatalogQuoteResponse.QuotedItem> items = new ArrayList<>();
        BigDecimal cakeTotal = cakeUnitPrice.multiply(BigDecimal.valueOf(request.quantity()));
        items.add(new CatalogQuoteResponse.QuotedItem(product.getId(), "CAKE", product.getName(),
                product.getDescription(), request.quantity(), cakeUnitPrice, cakeTotal,
                Map.of("options", optionSnapshots)));
        BigDecimal subtotal = cakeTotal;
        Set<UUID> addOnIds = new HashSet<>();
        for (var selection : request.addOns() == null ? List.<CatalogQuoteRequest.AddOnSelection>of()
                : request.addOns()) {
            if (selection == null || selection.addOnId() == null || selection.quantity() < 1
                    || selection.quantity() > 100 || !addOnIds.add(selection.addOnId())) {
                throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid add-on selection");
            }
            AddOn addOn = addOnRepository.findByIdAndBakery_Id(selection.addOnId(), request.bakeryId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Add-on not found"));
            if (!addOn.isActive()) {
                throw new AppException(HttpStatus.CONFLICT, "Add-on is inactive");
            }
            BigDecimal lineTotal = addOn.getPrice().multiply(BigDecimal.valueOf(selection.quantity()));
            subtotal = subtotal.add(lineTotal);
            items.add(new CatalogQuoteResponse.QuotedItem(addOn.getId(), "ADD_ON", addOn.getName(),
                    addOn.getDescription(), selection.quantity(), addOn.getPrice(), lineTotal, Map.of()));
        }
        if (subtotal.compareTo(area.getMinimumOrder()) < 0) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, "Order is below delivery minimum");
        }
        return new CatalogQuoteResponse(UUID.randomUUID(), request.bakeryId(),
                product.getBakery().getName(), product.getId(), product.getName(),
                product.getDescription(), request.quantity(), List.copyOf(items), subtotal,
                area.getDeliveryFee(), subtotal.add(area.getDeliveryFee()),
                product.getMinimumNoticeHours(), Instant.now().plusSeconds(300));
    }
}
