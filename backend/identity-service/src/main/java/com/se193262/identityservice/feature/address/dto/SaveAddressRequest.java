package com.se193262.identityservice.feature.address.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.groups.Default;
import java.math.BigDecimal;

/** Null patch fields are unchanged; an empty ward clears the optional ward. */
public record SaveAddressRequest(
        @NotBlank(groups = Create.class) @Size(max = 80) String label,
        @NotBlank(groups = Create.class) @Size(max = 120) String recipientName,
        @NotBlank(groups = Create.class) @Size(max = 30) String recipientPhone,
        @NotBlank(groups = Create.class) @Size(max = 255) String addressLine,
        @Size(max = 120) String ward,
        @NotBlank(groups = Create.class) @Size(max = 120) String district,
        @NotBlank(groups = Create.class) @Size(max = 120) String city,
        @DecimalMin("-90") @DecimalMax("90") @Digits(integer = 2, fraction = 6) BigDecimal latitude,
        @DecimalMin("-180") @DecimalMax("180") @Digits(integer = 3, fraction = 6) BigDecimal longitude,
        Boolean isDefault) {
    public interface Create extends Default { }

    public SaveAddressRequest merge(AddressResponse current) {
        return new SaveAddressRequest(
                label == null ? current.label() : label,
                recipientName == null ? current.recipientName() : recipientName,
                recipientPhone == null ? current.recipientPhone() : recipientPhone,
                addressLine == null ? current.addressLine() : addressLine,
                ward == null ? current.ward() : ward,
                district == null ? current.district() : district,
                city == null ? current.city() : city,
                latitude == null ? current.latitude() : latitude,
                longitude == null ? current.longitude() : longitude,
                isDefault == null ? current.isDefault() : isDefault);
    }
}
