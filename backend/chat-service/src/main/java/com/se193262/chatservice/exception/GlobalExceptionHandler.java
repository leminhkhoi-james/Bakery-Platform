package com.se193262.chatservice.exception;

import com.se193262.chatservice.shared.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import com.se193262.chatservice.infrastructure.storage.StorageUnavailableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ChatException.class)
    ResponseEntity<ApiResponse<Void>> handleChatException(ChatException exception) {
        return error(exception.getStatus(), exception.getMessage());
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class,
            MaxUploadSizeExceededException.class})
    ResponseEntity<ApiResponse<Void>> handleInvalidRequest(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, "Request validation failed");
    }

    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class})
    ResponseEntity<ApiResponse<Void>> handleConflict(RuntimeException exception) {
        return error(HttpStatus.CONFLICT, "The request conflicts with existing chat data");
    }

    @ExceptionHandler(StorageUnavailableException.class)
    ResponseEntity<ApiResponse<Void>> handleStorageUnavailable(StorageUnavailableException exception) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "Attachment storage is unavailable");
    }

    private ResponseEntity<ApiResponse<Void>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(status.value(), message));
    }
}
