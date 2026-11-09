package com.se193262.bakeryservice.shared;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/** Comparison keys only: keep the original address text for display and snapshots. */
public final class DeliveryLocation {
    private static final Pattern NUMBERED_DISTRICT =
            Pattern.compile("^(?:(?:quan|q|district|d)\\s*)?0*([1-9][0-9]*)$");
    private static final Set<String> HO_CHI_MINH_ALIASES =
            Set.of("ho chi minh", "hcm", "tphcm", "tp hcm");

    private DeliveryLocation() { }

    public static boolean matches(String city, String district, String otherCity, String otherDistrict) {
        String cityKey = cityKey(city);
        String districtKey = districtKey(district);
        return !cityKey.isEmpty() && !districtKey.isEmpty()
                && cityKey.equals(cityKey(otherCity)) && districtKey.equals(districtKey(otherDistrict));
    }

    private static String cityKey(String value) {
        String key = textKey(value).replaceFirst("^(?:thanh pho|tp|tinh)\\s+", "")
                .replaceFirst("\\s+city$", "");
        return HO_CHI_MINH_ALIASES.contains(key) ? "ho chi minh" : key;
    }

    private static String districtKey(String value) {
        String key = textKey(value);
        var numbered = NUMBERED_DISTRICT.matcher(key);
        // A bare number is a numbered urban district, never a ward or named rural district.
        return numbered.matches() ? "quan " + numbered.group(1) : key;
    }

    private static String textKey(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT).replace('.', ' ')
                .replaceAll("[\\s\\p{Z}]+", " ").trim();
    }
}
