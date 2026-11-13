package com.se193262.chatservice.infrastructure.storage;

public class StorageUnavailableException extends RuntimeException {

    public StorageUnavailableException(String message, Exception cause) {
        super(message, cause);
    }
}
