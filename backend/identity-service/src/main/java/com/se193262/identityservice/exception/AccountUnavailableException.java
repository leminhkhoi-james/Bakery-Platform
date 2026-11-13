package com.se193262.identityservice.exception;

import org.springframework.http.HttpStatus;

public class AccountUnavailableException extends AppException {

    public AccountUnavailableException() {
        super("Account is not active", HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE");
    }
}
