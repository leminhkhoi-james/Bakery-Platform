package com.se193262.bakeryservice.feature.catalog;

import com.se193262.bakeryservice.feature.catalog.dto.CatalogContracts.*;

import java.util.*;

public interface CatalogService {
    Bakery bakery(UUID bakeryId);

    Membership authorization(UUID bakeryId, UUID userId, String requiredRole);

    List<Membership> memberships(UUID userId);

    Quote quote(QuoteRequest request, boolean productRequired);
}
