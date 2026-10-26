package com.se193262.identityservice.exception;

import org.springframework.http.HttpStatus;

public class DuplicateEmailException extends AppException {

    public DuplicateEmailException() {
        super("Email is already registered", HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS");
    }
}
