package com.se193262.identityservice.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String resourceName) {
        super(resourceName + " not found", HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }
}
