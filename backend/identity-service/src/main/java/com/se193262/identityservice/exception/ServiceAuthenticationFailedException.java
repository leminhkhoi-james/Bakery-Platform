package com.se193262.identityservice.exception;

import org.springframework.http.HttpStatus;

public class ServiceAuthenticationFailedException extends AppException {
    public ServiceAuthenticationFailedException() {
        super("Invalid service credentials or grant", HttpStatus.UNAUTHORIZED, "INVALID_CLIENT");
    }
}
