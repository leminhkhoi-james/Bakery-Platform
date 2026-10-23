package com.se193262.orderservice.exception;

import com.se193262.orderservice.feature.order.InvalidOrderRequestException;
import com.se193262.orderservice.feature.order.OrderAccessDeniedException;
import com.se193262.orderservice.feature.order.OrderAuthenticationRequiredException;
import com.se193262.orderservice.feature.order.OrderConflictException;
import com.se193262.orderservice.feature.order.OrderNotFoundException;
import com.se193262.orderservice.feature.review.ReviewNotFoundException;
import com.se193262.orderservice.infrastructure.client.RemoteServiceException;
import com.se193262.orderservice.shared.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderAuthenticationRequiredException.class)
    ResponseEntity<ApiResponse<Void>> handleAuthenticationRequired(OrderAuthenticationRequiredException exception) {
        return error(HttpStatus.UNAUTHORIZED, exception.getMessage());
    }

    @ExceptionHandler(OrderAccessDeniedException.class)
    ResponseEntity<ApiResponse<Void>> handleAccessDenied(OrderAccessDeniedException exception) {
        return error(HttpStatus.FORBIDDEN, exception.getMessage());
    }

    @ExceptionHandler(OrderConflictException.class)
    ResponseEntity<ApiResponse<Void>> handleConflict(OrderConflictException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler({OrderNotFoundException.class, ReviewNotFoundException.class})
    ResponseEntity<ApiResponse<Void>> handleNotFound(RuntimeException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler({OptimisticLockingFailureException.class, DataIntegrityViolationException.class})
    ResponseEntity<ApiResponse<Void>> handlePersistenceConflict(RuntimeException exception) {
        return error(HttpStatus.CONFLICT, "The resource changed concurrently or conflicts with existing data");
    }

    @ExceptionHandler(InvalidOrderRequestException.class)
    ResponseEntity<ApiResponse<Void>> handleInvalidOrder(InvalidOrderRequestException exception) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
    }

        @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ApiResponse<Void>> handleValidation(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, "Request validation failed");
    }

    @ExceptionHandler(RemoteServiceException.class)
    ResponseEntity<ApiResponse<Void>> handleRemoteFailure(RemoteServiceException exception) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "A required service is unavailable");
    }

    private ResponseEntity<ApiResponse<Void>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(status.value(), message));
    }
}