package com.se193262.identityservice.shared.dto;

import java.time.Instant;

public record ApiResponse<T>(
        int statusCode,
        String message,
        T data,
        Instant timestamp
) {

    public static <T> ApiResponse<T> success(T data) {
        return of(200, "Success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return of(200, message, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return of(201, "Created", data);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return of(201, message, data);
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return of(statusCode, message, null);
    }

    public static <T> ApiResponse<T> of(int statusCode, String message, T data) {
        return new ApiResponse<>(statusCode, message, data, Instant.now());
    }
}
