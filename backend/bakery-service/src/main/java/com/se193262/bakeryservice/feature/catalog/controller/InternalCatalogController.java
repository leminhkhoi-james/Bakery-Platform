package com.se193262.bakeryservice.feature.catalog.controller;

import com.se193262.bakeryservice.feature.catalog.dto.CatalogQuoteRequest;
import com.se193262.bakeryservice.feature.catalog.dto.CatalogQuoteResponse;
import com.se193262.bakeryservice.feature.catalog.service.CatalogQuoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/catalog")
public class InternalCatalogController {
    private final CatalogQuoteService quoteService;

    public InternalCatalogController(CatalogQuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @PostMapping("/quotes")
    public ResponseEntity<CatalogQuoteResponse> quote(@Valid @RequestBody CatalogQuoteRequest request) {
        return ResponseEntity.ok(quoteService.quote(request));
    }
}
