package com.se193262.platform.exception;

public class BusinessException extends AppException {
    public BusinessException(int status, String message) {
        super(status, message);
    }

    public static BusinessException missing() {
        return new BusinessException(404, "Resource not found");
    }

    public static BusinessException forbidden() {
        return new BusinessException(403, "Access denied");
    }

    public static BusinessException conflict() {
        return new BusinessException(409, "Resource state conflict");
    }

    public static BusinessException invalid(String message) {
        return new BusinessException(422, message);
    }

    public static BusinessException unavailable() {
        return new BusinessException(503, "Required service unavailable");
    }
}
