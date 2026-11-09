package com.se193262.marketplaceservice.exception;

import com.se193262.platform.dto.ApiResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** A database-selected deadlock victim rolls back; it is a concurrency conflict,
 * not an unknown application error. The caller must reconcile before retrying. */
@RestControllerAdvice(basePackages = "com.se193262.marketplaceservice")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MarketplaceConcurrencyExceptionHandler {
    @ExceptionHandler(PessimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> conflict(PessimisticLockingFailureException error) {
        return ResponseEntity.status(409).body(ApiResponse.error(409, "Resource state conflict"));
    }
}
