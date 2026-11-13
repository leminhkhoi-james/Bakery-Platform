package com.se193262.identityservice.feature.user.dto;

import com.se193262.identityservice.feature.user.CustomerProfile;
import com.se193262.identityservice.feature.user.User;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String displayName,
        String phoneNumber,
        String status,
        boolean emailVerified,
        LocalDate dateOfBirth,
        String preferredLanguage,
        String avatarUrl,
        Instant avatarUrlExpiresAt,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt
) {

    public static UserProfileResponse fromEntity(User user) {
        CustomerProfile profile = user.getCustomerProfile();
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getCode())
                .sorted()
                .toList();
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                user.getStatus().name(),
                user.isEmailVerified(),
                profile == null ? null : profile.getDateOfBirth(),
                profile == null ? null : profile.getPreferredLanguage(),
                null,
                null,
                roles,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
