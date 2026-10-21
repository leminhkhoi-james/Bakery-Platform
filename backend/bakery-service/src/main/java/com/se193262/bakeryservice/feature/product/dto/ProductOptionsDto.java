package com.se193262.bakeryservice.feature.product.dto;

import com.se193262.bakeryservice.feature.product.entity.ProductOptionGroup;
import com.se193262.bakeryservice.feature.product.entity.ProductOptionValue;
import com.se193262.bakeryservice.feature.product.entity.SelectionType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductOptionsDto(List<Group> groups) {

    public record Group(UUID id, String name, SelectionType selectionType, Boolean required,
                        Integer minimumSelections, Integer maximumSelections, Integer displayOrder,
                        List<Value> values) {
        public static Group fromEntity(ProductOptionGroup group, List<ProductOptionValue> values) {
            return new Group(group.getId(), group.getName(), group.getSelectionType(),
                    group.isRequired(), group.getMinimumSelections(), group.getMaximumSelections(),
                    group.getDisplayOrder(), values.stream().map(Value::fromEntity).toList());
        }
    }

    public record Value(UUID id, String name, String description, BigDecimal priceAdjustment,
                        Boolean active, Integer displayOrder) {
        public static Value fromEntity(ProductOptionValue value) {
            return new Value(value.getId(), value.getName(), value.getDescription(),
                    value.getPriceAdjustment(), value.isActive(), value.getDisplayOrder());
        }
    }
}
