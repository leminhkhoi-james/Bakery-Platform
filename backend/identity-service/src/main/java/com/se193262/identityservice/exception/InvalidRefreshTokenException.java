package com.se193262.identityservice.exception;

import org.springframework.http.HttpStatus;

public class InvalidRefreshTokenException extends AppException {

    public InvalidRefreshTokenException() {
        super("Refresh token is missing, expired, revoked, or invalid",
                HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
    }
}
