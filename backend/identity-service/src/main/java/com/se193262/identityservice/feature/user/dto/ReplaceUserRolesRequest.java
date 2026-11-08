package com.se193262.identityservice.feature.user.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record ReplaceUserRolesRequest(@NotEmpty Set<@NotNull String> roles) {
}
