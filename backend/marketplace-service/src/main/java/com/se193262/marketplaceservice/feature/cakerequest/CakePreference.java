package com.se193262.marketplaceservice.feature.cakerequest;

import jakarta.persistence.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.*;

@Entity
@Table(name = "cake_preferences")
public class CakePreference {
    @Id
    @Column(name = "cake_request_id", nullable = false)
    private UUID cakeRequestId;

    @Column(name = "cake_size", nullable = true, length = 80)
    private String cakeSize;

    @Column(name = "cake_shape", nullable = true, length = 80)
    private String cakeShape;

    @Column(name = "flavor", nullable = true, length = 120)
    private String flavor;

    @Column(name = "filling", nullable = true, length = 120)
    private String filling;

    @Column(name = "frosting", nullable = true, length = 120)
    private String frosting;

    @Column(name = "color_palette", nullable = true, length = 255)
    private String colorPalette;

    @Column(name = "decoration_notes", nullable = true, columnDefinition = "text")
    private String decorationNotes;

    @Column(name = "allergy_notes", nullable = true, columnDefinition = "text")
    private String allergyNotes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra_options", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> extraOptions = new LinkedHashMap<>();

    protected CakePreference() {}

    public static CakePreference create() {
        return new CakePreference();
    }

    public UUID getCakeRequestId() {
        return cakeRequestId;
    }

    public void setCakeRequestId(UUID value) {
        this.cakeRequestId = value;
    }

    public String getCakeSize() {
        return cakeSize;
    }

    public void setCakeSize(String value) {
        this.cakeSize = value;
    }

    public String getCakeShape() {
        return cakeShape;
    }

    public void setCakeShape(String value) {
        this.cakeShape = value;
    }

    public String getFlavor() {
        return flavor;
    }

    public void setFlavor(String value) {
        this.flavor = value;
    }

    public String getFilling() {
        return filling;
    }

    public void setFilling(String value) {
        this.filling = value;
    }

    public String getFrosting() {
        return frosting;
    }

    public void setFrosting(String value) {
        this.frosting = value;
    }

    public String getColorPalette() {
        return colorPalette;
    }

    public void setColorPalette(String value) {
        this.colorPalette = value;
    }

    public String getDecorationNotes() {
        return decorationNotes;
    }

    public void setDecorationNotes(String value) {
        this.decorationNotes = value;
    }

    public String getAllergyNotes() {
        return allergyNotes;
    }

    public void setAllergyNotes(String value) {
        this.allergyNotes = value;
    }

    public Map<String, Object> getExtraOptions() {
        return extraOptions;
    }

    public void setExtraOptions(Map<String, Object> value) {
        this.extraOptions = value;
    }
}
