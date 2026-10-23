package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.offer.OfferAcceptanceService;
import com.se193262.marketplaceservice.feature.offer.dto.OfferOrderSource;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/internal/v1")
public class MarketplaceContextController {
    private final CakeRequestService requests;
    private final OfferAcceptanceService offers;

    public MarketplaceContextController(
            CakeRequestService requests, OfferAcceptanceService offers) {
        this.requests = requests;
        this.offers = offers;
    }

    @GetMapping("/cake-requests/{id}/context")
    @PreAuthorize("hasAuthority('SCOPE_marketplace:request:read')")
    public Map<String, Object> context(@PathVariable UUID id) {
        return requests.context(id);
    }

    @GetMapping("/offers/{id}/order-source")
    @PreAuthorize("hasAuthority('SCOPE_marketplace:offer:read')")
    public OfferOrderSource source(@PathVariable UUID id) {
        return offers.orderSource(id);
    }
}
