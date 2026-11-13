package com.se193262.identityservice.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationFailedException extends AppException {

    public AuthenticationFailedException() {
        super("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }
}
