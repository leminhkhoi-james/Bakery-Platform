package com.se193262.identityservice.feature.user.dto;

import com.se193262.identityservice.feature.user.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(@NotNull UserStatus status) {
}
