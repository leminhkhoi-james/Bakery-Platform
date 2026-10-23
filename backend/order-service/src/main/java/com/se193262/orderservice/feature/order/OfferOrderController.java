package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.*;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/v1/orders")
public class OfferOrderController {
    private final OfferOrderService service;

    public OfferOrderController(OfferOrderService service) {
        this.service = service;
    }

    @PostMapping("/from-offer")
    @PreAuthorize("hasAuthority('SCOPE_order:create-from-offer')")
    public org.springframework.http.ResponseEntity<OrderCreationResponse> create(
            @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody CreateOfferOrderRequest command) {
        var result = service.create(key, command);
        return org.springframework.http.ResponseEntity.status(result.created() ? 201 : 200)
                .body(result.response());
    }
}
