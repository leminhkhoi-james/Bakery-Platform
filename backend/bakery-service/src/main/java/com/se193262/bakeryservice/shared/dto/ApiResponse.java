package com.se193262.bakeryservice.shared.dto;

import java.time.Instant;

public record ApiResponse<T>(
        int statusCode,
        String message,
        T data,
        Instant timestamp
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "Success", data, Instant.now());
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, "Created", data, Instant.now());
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return new ApiResponse<>(statusCode, message, null, Instant.now());
    }

    public static <T> ApiResponse<T> of(int statusCode, String message, T data) {
        return new ApiResponse<>(statusCode, message, data, Instant.now());
    }
}
