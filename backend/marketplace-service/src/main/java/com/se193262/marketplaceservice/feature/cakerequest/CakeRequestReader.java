package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.*;
import com.se193262.marketplaceservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CakeRequestReader {
    private final CakeRequestRepository requests;
    private final CakePreferenceRepository preferences;
    private final RequestOptionSelectionRepository options;
    private final RequestImageRepository images;
    private final RequestStatusHistoryRepository history;
    private final CakeRequestMapper mapper;
    private final ImageStorage storage;
    private final com.se193262.marketplaceservice.feature.offer.OfferRepository offers;
    private final com.se193262.marketplaceservice.infrastructure.client.BakeryClient bakery;

    public CakeRequestReader(
            CakeRequestRepository requests,
            CakePreferenceRepository preferences,
            RequestOptionSelectionRepository options,
            RequestImageRepository images,
            RequestStatusHistoryRepository history,
            CakeRequestMapper mapper,
            ImageStorage storage,
            com.se193262.marketplaceservice.feature.offer.OfferRepository offers,
            com.se193262.marketplaceservice.infrastructure.client.BakeryClient bakery) {
        this.requests = requests;
        this.preferences = preferences;
        this.options = options;
        this.images = images;
        this.history = history;
        this.mapper = mapper;
        this.storage = storage;
        this.offers = offers;
        this.bakery = bakery;
    }

    public CakeRequest request(UUID id) {
        return requests.findById(id).orElseThrow(BusinessException::missing);
    }

    public CreateCakeRequestRequest command(CakeRequest request) {
        return mapper.command(
                request,
                preferences.findById(request.getId()).orElse(null),
                options.findByCakeRequestIdOrderByIdAsc(request.getId()));
    }

    public CakeRequestResponse detail(CakeRequest request) {
        Actor actor = Actor.current();
        boolean allOffers = actor.admin() || request.getCustomerId().equals(actor.id());
        Set<UUID> ids =
                allOffers
                        ? Set.of()
                        : bakery.memberships(actor.id()).stream()
                                .map(m -> m.bakeryId())
                                .collect(java.util.stream.Collectors.toSet());
        var summaries =
                (allOffers
                                ? offers.findTop100ByCakeRequestIdOrderByCreatedAtDesc(
                                        request.getId())
                                : offers.findTop100ByCakeRequestIdAndBakeryIdInOrderByCreatedAtDesc(
                                        request.getId(), ids))
                        .stream()
                                .map(
                                        o ->
                                                new CakeRequestResponse.OfferSummary(
                                                        o.getId(),
                                                        o.getBakeryId(),
                                                        o.getStatus(),
                                                        o.getTotalPrice(),
                                                        o.getExpiresAt()))
                                .toList();
        var imageResponses =
                images.findTop100ByCakeRequestIdOrderByDisplayOrderAsc(request.getId()).stream()
                        .map(this::image)
                        .toList();
        return mapper.detail(
                request,
                preferences.findById(request.getId()).orElse(null),
                options.findByCakeRequestIdOrderByIdAsc(request.getId()),
                imageResponses,
                history.findTop100ByCakeRequestIdOrderByChangedAtDesc(request.getId()),
                summaries);
    }

    public RequestImageResponse image(RequestImage image) {
        return new RequestImageResponse(
                image.getId(),
                storage.signedUrl(image.getObjectKey()),
                java.time.Instant.now().plusSeconds(900),
                image.getMediaType(),
                image.getDisplayOrder(),
                image.getSizeBytes());
    }
}
