package com.se193262.marketplaceservice.feature.cakerequest;

import jakarta.persistence.*;

import java.util.*;

@Entity
@Table(name = "request_option_selections")
public class RequestOptionSelection {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "cake_request_id", nullable = false)
    private UUID cakeRequestId;

    @Column(name = "option_group_id", nullable = false)
    private UUID optionGroupId;

    @Column(name = "option_value_id", nullable = false)
    private UUID optionValueId;

    @Column(name = "group_name_snapshot", nullable = false, length = 120)
    private String groupNameSnapshot;

    @Column(name = "value_name_snapshot", nullable = false, length = 120)
    private String valueNameSnapshot;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    protected RequestOptionSelection() {}

    public static RequestOptionSelection create() {
        return new RequestOptionSelection();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID value) {
        this.id = value;
    }

    public UUID getCakeRequestId() {
        return cakeRequestId;
    }

    public void setCakeRequestId(UUID value) {
        this.cakeRequestId = value;
    }

    public UUID getOptionGroupId() {
        return optionGroupId;
    }

    public void setOptionGroupId(UUID value) {
        this.optionGroupId = value;
    }

    public UUID getOptionValueId() {
        return optionValueId;
    }

    public void setOptionValueId(UUID value) {
        this.optionValueId = value;
    }

    public String getGroupNameSnapshot() {
        return groupNameSnapshot;
    }

    public void setGroupNameSnapshot(String value) {
        this.groupNameSnapshot = value;
    }

    public String getValueNameSnapshot() {
        return valueNameSnapshot;
    }

    public void setValueNameSnapshot(String value) {
        this.valueNameSnapshot = value;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer value) {
        this.quantity = value;
    }
}
