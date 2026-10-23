package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.shared.dto.PageResponse;

import java.util.*;

public interface OfferService {
    OfferResponse create(UUID requestId, CreateOfferRequest command);

    OfferResponse patch(UUID offerId, PatchOfferRequest command);

    OfferResponse detail(UUID offerId);

    OfferResponse withdraw(UUID offerId, String reason);

    PageResponse<OfferResponse> list(Map<String, String> filters);
}
