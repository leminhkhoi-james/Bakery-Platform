package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.Quote;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class OfferData {
    private final OfferItemRepository items;
    private final OfferStatusHistoryRepository histories;
    private final OfferMapper mapper;

    public OfferData(
            OfferItemRepository items, OfferStatusHistoryRepository histories, OfferMapper mapper) {
        this.items = items;
        this.histories = histories;
        this.mapper = mapper;
    }

    public OfferResponse detail(Offer offer) {
        return mapper.response(
                offer,
                items.findByOfferIdOrderByIdAsc(offer.getId()),
                histories.findTop100ByOfferIdOrderByChangedAtDesc(offer.getId()));
    }

    public OfferResponse summary(Offer offer) {
        return mapper.response(offer, List.of(), List.of());
    }

    public CreateOfferRequest command(Offer offer) {
        return new CreateOfferRequest(
                offer.getBakeryId(),
                offer.getMessage(),
                offer.getCakePrice(),
                offer.getDeliveryFee(),
                offer.getEstimatedCompletionAt(),
                offer.getExpiresAt(),
                items.findByOfferIdOrderByIdAsc(offer.getId()).stream()
                        .map(
                                i ->
                                        new com.se193262.marketplaceservice.infrastructure.client
                                                .CatalogContracts.AddOn(
                                                i.getAddOnId(), i.getQuantity()))
                        .toList());
    }

    public void apply(Offer offer, CreateOfferRequest command, Quote quote) {
        offer.setMessage(command.message());
        offer.setCakePrice(command.cakePrice());
        offer.setDeliveryFee(command.deliveryFee());
        offer.setEstimatedCompletionAt(command.estimatedCompletionAt());
        offer.setExpiresAt(command.expiresAt());
        offer.setAddOnTotal(quote.addOnTotal());
        offer.setTotalPrice(command.cakePrice().add(command.deliveryFee()).add(quote.addOnTotal()));
        items.deleteByOfferId(offer.getId());
        items.flush();
        for (var snapshot : quote.items()) {
            var item = OfferItem.create();
            item.setId(UUID.randomUUID());
            item.setOfferId(offer.getId());
            item.setAddOnId(snapshot.addOnId());
            item.setItemNameSnapshot(snapshot.itemNameSnapshot());
            item.setDescriptionSnapshot(snapshot.descriptionSnapshot());
            item.setQuantity(snapshot.quantity());
            item.setUnitPrice(snapshot.unitPrice());
            item.setLineTotal(snapshot.lineTotal());
            items.save(item);
        }
    }
}
