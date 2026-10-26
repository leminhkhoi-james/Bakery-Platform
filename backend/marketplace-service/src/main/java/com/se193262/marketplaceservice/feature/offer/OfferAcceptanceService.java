package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.*;

import java.util.UUID;

public interface OfferAcceptanceService {
    AcceptanceResponse accept(UUID offerId, String key, AcceptOfferRequest command);

    OfferOrderSource orderSource(UUID offerId);

    void recover();
}
