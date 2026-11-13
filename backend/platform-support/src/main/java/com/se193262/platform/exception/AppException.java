package com.se193262.platform.exception;

public abstract class AppException extends RuntimeException {
    private final int status;

    protected AppException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int status() {
        return status;
    }
}
