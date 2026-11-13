package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.feature.authentication.dto.LoginRequest;
import com.se193262.identityservice.feature.authentication.dto.RegisterRequest;
import com.se193262.identityservice.feature.user.dto.UserProfileResponse;

import java.util.UUID;

public interface AuthenticationService {

    UserProfileResponse register(RegisterRequest request);

    AuthenticationResult login(LoginRequest request);

    AuthenticationResult refresh(String rawRefreshToken);

    void logout(String rawRefreshToken);

    UserProfileResponse getCurrentUser(UUID userId);
}
