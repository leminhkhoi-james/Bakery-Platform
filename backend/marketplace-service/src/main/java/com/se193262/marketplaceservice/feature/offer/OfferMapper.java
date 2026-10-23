package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.shared.dto.HistoryResponse;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class OfferMapper {
    public OfferResponse response(
            Offer o, List<OfferItem> items, List<OfferStatusHistory> history) {
        return new OfferResponse(
                o.getId(),
                o.getCakeRequestId(),
                o.getBakeryId(),
                o.getMessage(),
                o.getCakePrice(),
                o.getDeliveryFee(),
                o.getAddOnTotal(),
                o.getTotalPrice(),
                o.getEstimatedCompletionAt(),
                o.getExpiresAt(),
                o.getStatus(),
                items.stream()
                        .map(
                                i ->
                                        new OfferResponse.Item(
                                                i.getId(),
                                                i.getAddOnId(),
                                                i.getItemNameSnapshot(),
                                                i.getDescriptionSnapshot(),
                                                i.getQuantity(),
                                                i.getUnitPrice(),
                                                i.getLineTotal()))
                        .toList(),
                history.stream()
                        .map(
                                h ->
                                        new HistoryResponse(
                                                h.getFromStatus(),
                                                h.getToStatus(),
                                                h.getChangedBy(),
                                                h.getReason(),
                                                h.getChangedAt()))
                        .toList(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                o.getVersion());
    }
}
