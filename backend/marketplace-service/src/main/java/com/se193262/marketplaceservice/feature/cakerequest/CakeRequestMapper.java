package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.OptionSnapshot;
import com.se193262.marketplaceservice.shared.dto.HistoryResponse;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CakeRequestMapper {
    public CakeRequestSummaryResponse summary(CakeRequest request) {
        return new CakeRequestSummaryResponse(
                request.getId(),
                request.getTargetBakeryId(),
                request.getRequestType(),
                request.getTitle(),
                request.getBudgetMin(),
                request.getBudgetMax(),
                request.getNeededAt(),
                request.getDeliveryCity(),
                request.getDeliveryDistrict(),
                request.getStatus(),
                request.getOfferDeadline(),
                request.getCreatedAt());
    }

    public CreateCakeRequestRequest command(
            CakeRequest request, CakePreference preference, List<RequestOptionSelection> options) {
        return new CreateCakeRequestRequest(
                request.getRequestType(),
                request.getTargetBakeryId(),
                request.getBaseProductId(),
                request.getTitle(),
                request.getDescription(),
                request.getOccasion(),
                request.getServingSize(),
                request.getBudgetMin(),
                request.getBudgetMax(),
                request.getNeededAt(),
                request.getDeliveryDistrict(),
                request.getDeliveryCity(),
                request.getOfferDeadline(),
                preference(preference),
                options.stream()
                        .map(
                                o ->
                                        new com.se193262.marketplaceservice.infrastructure.client
                                                .CatalogContracts.Option(
                                                o.getOptionGroupId(),
                                                o.getOptionValueId(),
                                                o.getQuantity()))
                        .toList());
    }

    public CreateCakeRequestRequest.Preference preference(CakePreference p) {
        return p == null
                ? null
                : new CreateCakeRequestRequest.Preference(
                        p.getCakeSize(),
                        p.getCakeShape(),
                        p.getFlavor(),
                        p.getFilling(),
                        p.getFrosting(),
                        p.getColorPalette(),
                        p.getDecorationNotes(),
                        p.getAllergyNotes(),
                        p.getExtraOptions());
    }

    public CakeRequestResponse detail(
            CakeRequest r,
            CakePreference p,
            List<RequestOptionSelection> options,
            List<RequestImageResponse> images,
            List<RequestStatusHistory> history,
            List<CakeRequestResponse.OfferSummary> offerSummaries) {
        return new CakeRequestResponse(
                r.getId(),
                r.getCustomerId(),
                r.getTargetBakeryId(),
                r.getBaseProductId(),
                r.getSelectedDesignId(),
                r.getRequestType(),
                r.getTitle(),
                r.getDescription(),
                r.getOccasion(),
                r.getServingSize(),
                r.getBudgetMin(),
                r.getBudgetMax(),
                r.getNeededAt(),
                r.getDeliveryDistrict(),
                r.getDeliveryCity(),
                r.getStatus(),
                r.getOfferDeadline(),
                preference(p),
                options.stream()
                        .map(
                                o ->
                                        new OptionSnapshot(
                                                o.getOptionGroupId(),
                                                o.getOptionValueId(),
                                                o.getGroupNameSnapshot(),
                                                o.getValueNameSnapshot(),
                                                o.getQuantity()))
                        .toList(),
                images,
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
                r.getSelectedDesignId() == null
                        ? null
                        : new CakeRequestResponse.SelectedDesignSummary(r.getSelectedDesignId()),
                offerSummaries,
                r.getCreatedAt(),
                r.getUpdatedAt(),
                r.getVersion());
    }

    public void apply(CakeRequest r, CreateCakeRequestRequest c) {
        r.setRequestType(c.requestType());
        r.setTargetBakeryId(c.targetBakeryId());
        r.setBaseProductId(c.baseProductId());
        r.setTitle(c.title());
        r.setDescription(c.description());
        r.setOccasion(c.occasion());
        r.setServingSize(c.servingSize());
        r.setBudgetMin(c.budgetMin());
        r.setBudgetMax(c.budgetMax());
        r.setNeededAt(c.neededAt());
        r.setDeliveryCity(c.deliveryCity());
        r.setDeliveryDistrict(c.deliveryDistrict());
        r.setOfferDeadline(c.offerDeadline());
    }
}
