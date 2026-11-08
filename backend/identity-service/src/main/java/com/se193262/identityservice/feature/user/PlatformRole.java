package com.se193262.identityservice.feature.user;

public enum PlatformRole {
    CUSTOMER,
    BAKERY_OWNER,
    ADMIN;

    public static boolean isSupported(String value) {
        try {
            valueOf(value);
            return true;
        } catch (IllegalArgumentException | NullPointerException exception) {
            return false;
        }
    }
}
