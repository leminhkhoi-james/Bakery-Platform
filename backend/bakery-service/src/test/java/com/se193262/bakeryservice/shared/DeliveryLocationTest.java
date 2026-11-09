package com.se193262.bakeryservice.shared;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class DeliveryLocationTest {
    @ParameterizedTest
    @DisplayName("Equivalent city and numbered-district spellings match existing service areas")
    @CsvSource({
            "TP Ho Chi Minh, Quan 5, TP. Hồ Chí Minh, 5",
            "HCM, District 5, Thành phố Hồ Chí Minh, Quận 5",
            "Ho Chi Minh City, D5, TPHCM, Q.5",
            "TP HCM, 05, Hồ Chí Minh, quận 5",
            "Hà Nội, Quận 1, TP. Ha Noi, 1"
    })
    void matches_equivalentSpelling_returnsTrue(String city, String district,
            String otherCity, String otherDistrict) {
        assertThat(DeliveryLocation.matches(city, district, otherCity, otherDistrict)).isTrue();
    }

    @ParameterizedTest
    @DisplayName("Normalization never grants delivery to another city, district or administrative type")
    @CsvSource(value = {
            "TP Ho Chi Minh|Quan 5|TP Ho Chi Minh|6",
            "TP Ho Chi Minh|Quan 5|Ha Noi|5",
            "TP Ho Chi Minh|Quan 5|TP Ho Chi Minh|Huyện 5",
            "TP Ho Chi Minh|Quan 5|TP Ho Chi Minh|Phường 5",
            "Ha Noi|Quan 1|Ha Noi|11",
            "Ha Noi|Quan 1||1",
            "Ha Noi|||1"
    }, delimiter = '|')
    void matches_differentOrMissingLocation_returnsFalse(String city, String district,
            String otherCity, String otherDistrict) {
        assertThat(DeliveryLocation.matches(city, district, otherCity, otherDistrict)).isFalse();
    }
}
