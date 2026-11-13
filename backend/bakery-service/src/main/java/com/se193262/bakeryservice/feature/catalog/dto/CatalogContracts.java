package com.se193262.bakeryservice.feature.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.*;

public final class CatalogContracts {
    private CatalogContracts() {}

    public record Area(
            String city, String district, BigDecimal deliveryFee, BigDecimal minimumOrder) {}

    public record Bakery(UUID id, String name, String status, List<Area> serviceAreas) {}

    public record Membership(
            UUID bakeryId, UUID userId, boolean active, String memberRole, boolean authorized) {}

    public record Option(
            @NotNull UUID optionGroupId, @NotNull UUID optionValueId, @Min(1) int quantity) {}

    public record AddOn(@NotNull UUID addOnId, @Min(1) int quantity) {}

    public record QuoteRequest(
            @NotNull UUID bakeryId,
            UUID productId,
            @NotBlank String deliveryCity,
            @NotBlank String deliveryDistrict,
            List<@NotNull @Valid Option> optionSelections,
            List<@NotNull @Valid AddOn> addOns) {}

    public record OptionSnapshot(
            UUID optionGroupId,
            UUID optionValueId,
            String groupNameSnapshot,
            String valueNameSnapshot,
            int quantity) {}

    public record ItemSnapshot(
            UUID addOnId,
            String itemNameSnapshot,
            String descriptionSnapshot,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {}

    public record Quote(
            UUID productId,
            String productName,
            boolean customizable,
            int minimumNoticeHours,
            List<OptionSnapshot> options,
            List<ItemSnapshot> items,
            BigDecimal addOnTotal) {}
}
