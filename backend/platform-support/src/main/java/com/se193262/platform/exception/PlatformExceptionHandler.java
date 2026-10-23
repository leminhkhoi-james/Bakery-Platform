package com.se193262.platform.exception;

import com.se193262.platform.dto.ApiResponse;

import org.springframework.dao.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.*;

@RestControllerAdvice
public class PlatformExceptionHandler {
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(PlatformExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<?> business(AppException error) {
        return ResponseEntity.status(error.status())
                .body(ApiResponse.error(error.status(), error.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> validation(MethodArgumentNotValidException error) {
        Map<String, String> fields = new LinkedHashMap<>();
        error.getBindingResult()
                .getFieldErrors()
                .forEach(e -> fields.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(400, "Validation failed", fields, java.time.Instant.now()));
    }

    @ExceptionHandler({
        MethodArgumentTypeMismatchException.class,
        HttpMessageNotReadableException.class,
        IllegalArgumentException.class,
        java.time.DateTimeException.class,
        MaxUploadSizeExceededException.class,
        org.springframework.web.bind.MissingServletRequestParameterException.class,
        org.springframework.web.bind.MissingRequestHeaderException.class,
        jakarta.validation.ConstraintViolationException.class
    })
    public ResponseEntity<?> bad(Exception error) {
        return ResponseEntity.badRequest().body(ApiResponse.error(400, "Invalid request"));
    }

    @ExceptionHandler({
        OptimisticLockingFailureException.class,
        DataIntegrityViolationException.class
    })
    public ResponseEntity<?> conflict(Exception error) {
        return ResponseEntity.status(409).body(ApiResponse.error(409, "Resource state conflict"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> denied(Exception error) {
        return ResponseEntity.status(403).body(ApiResponse.error(403, "Access denied"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> unexpected(Exception error) {
        log.error("Unexpected service error", error);
        return ResponseEntity.internalServerError()
                .body(ApiResponse.error(500, "Internal server error"));
    }
}
