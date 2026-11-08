package com.se193262.identityservice.feature.user.dto;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateMyProfileRequest(
        @Size(min = 1, max = 120) String displayName,
        @Size(max = 30) String phoneNumber,
        @Past LocalDate dateOfBirth,
        @Size(min = 2, max = 10) String preferredLanguage) {

    public boolean hasChanges() {
        return displayName != null || phoneNumber != null || dateOfBirth != null || preferredLanguage != null;
    }
}
