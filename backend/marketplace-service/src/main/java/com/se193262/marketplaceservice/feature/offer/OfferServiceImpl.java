package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.BakeryClient;
import com.se193262.marketplaceservice.shared.QueryPaging;
import com.se193262.marketplaceservice.shared.dto.PageResponse;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.util.*;

@Service
public class OfferServiceImpl implements OfferService {
    private final OfferRepository offers;
    private final CakeRequestReader requests;
    private final MarketplaceAccess access;
    private final OfferRules rules;
    private final OfferData data;
    private final OfferTransitions transitions;
    private final BakeryClient bakery;
    private final ObjectMapper json;
    private final Clock clock;

    public OfferServiceImpl(
            OfferRepository offers,
            CakeRequestReader requests,
            MarketplaceAccess access,
            OfferRules rules,
            OfferData data,
            OfferTransitions transitions,
            BakeryClient bakery,
            ObjectMapper json,
            Clock clock) {
        this.offers = offers;
        this.requests = requests;
        this.access = access;
        this.rules = rules;
        this.data = data;
        this.transitions = transitions;
        this.bakery = bakery;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public OfferResponse create(UUID requestId, CreateOfferRequest command) {
        var actor = Actor.current();
        access.bakeryMember(command.bakeryId(), actor, false);
        var request = requests.request(requestId);
        access.mutable(request);
        if (offers.existsByCakeRequestIdAndBakeryId(requestId, command.bakeryId()))
            throw BusinessException.conflict();
        var quote = rules.validate(request, command);
        access.touch(request, clock.instant());
        var offer = Offer.create();
        offer.setId(UUID.randomUUID());
        offer.setCakeRequestId(requestId);
        offer.setBakeryId(command.bakeryId());
        offer.setCreatedAt(clock.instant());
        offer.setUpdatedAt(clock.instant());
        offer.setMessage(command.message());
        offer.setCakePrice(command.cakePrice());
        offer.setDeliveryFee(command.deliveryFee());
        offer.setAddOnTotal(quote.addOnTotal());
        offer.setTotalPrice(command.cakePrice().add(command.deliveryFee()).add(quote.addOnTotal()));
        offer.setEstimatedCompletionAt(command.estimatedCompletionAt());
        offer.setExpiresAt(command.expiresAt());
        offer.setStatus(OfferStatus.PENDING);
        offers.saveAndFlush(offer);
        data.apply(offer, command, quote);
        transitions.change(offer, OfferStatus.PENDING, actor.id(), "Submitted");
        offers.flush();
        return data.detail(offer);
    }

    private Offer offer(UUID id) {
        return offers.findById(id).orElseThrow(BusinessException::missing);
    }

    private void pending(Offer offer) {
        if (offer.getStatus() != OfferStatus.PENDING
                || !offer.getExpiresAt().isAfter(clock.instant()))
            throw BusinessException.conflict();
    }

    @Transactional
    public OfferResponse patch(UUID id, PatchOfferRequest patch) {
        var actor = Actor.current();
        var offer = offer(id);
        access.bakeryMember(offer.getBakeryId(), actor, true);
        pending(offer);
        var request = requests.request(offer.getCakeRequestId());
        access.mutable(request);
        if (patch.changes() == null
                || patch.changes().isEmpty()
                || patch.changes().containsKey("bakeryId"))
            throw new BusinessException(400, "Invalid patch");
        @SuppressWarnings("unchecked")
        Map<String, Object> merged = json.convertValue(data.command(offer), Map.class);
        if (!merged.keySet().containsAll(patch.changes().keySet()))
            throw new BusinessException(400, "Unsupported patch field");
        merged.putAll(patch.changes());
        CreateOfferRequest command;
        try {
            command = json.convertValue(merged, CreateOfferRequest.class);
        } catch (Exception error) {
            throw new BusinessException(400, "Invalid patch");
        }
        var quote = rules.validate(request, command);
        data.apply(offer, command, quote);
        offer.setUpdatedAt(clock.instant());
        access.touch(request, clock.instant());
        offers.flush();
        return data.detail(offer);
    }

    @Transactional
    public OfferResponse withdraw(UUID id, String reason) {
        var actor = Actor.current();
        var offer = offer(id);
        access.bakeryMember(offer.getBakeryId(), actor, true);
        pending(offer);
        var request = requests.request(offer.getCakeRequestId());
        access.mutable(request);
        access.touch(request, clock.instant());
        transitions.change(offer, OfferStatus.WITHDRAWN, actor.id(), reason);
        offers.flush();
        return data.detail(offer);
    }

    @Transactional(readOnly = true)
    public OfferResponse detail(UUID id) {
        var offer = offer(id);
        var actor = Actor.current();
        var request = requests.request(offer.getCakeRequestId());
        if (!actor.admin() && !request.getCustomerId().equals(actor.id()))
            access.bakeryMember(offer.getBakeryId(), actor, false);
        return data.detail(offer);
    }

    @Transactional(readOnly = true)
    public PageResponse<OfferResponse> list(Map<String, String> filters) {
        var actor = Actor.current();
        String scope = filters.getOrDefault("scope", actor.customer() ? "received" : "sent");
        Specification<Offer> specification;
        if (actor.admin()) specification = (root, q, b) -> b.conjunction();
        else if (scope.equals("received") && actor.customer())
            specification =
                    (root, q, b) -> {
                        var sub = q.subquery(UUID.class);
                        var request = sub.from(CakeRequest.class);
                        sub.select(request.get("id"))
                                .where(b.equal(request.get("customerId"), actor.id()));
                        return root.get("cakeRequestId").in(sub);
                    };
        else if (scope.equals("sent") && actor.bakery()) {
            var ids = bakery.memberships(actor.id()).stream().map(m -> m.bakeryId()).toList();
            specification = (root, q, b) -> root.get("bakeryId").in(ids);
        } else throw BusinessException.forbidden();
        for (String field : List.of("cakeRequestId", "bakeryId", "status"))
            if (filters.containsKey(field)) {
                String value = filters.get(field);
                specification =
                        specification.and(
                                (root, q, b) ->
                                        b.equal(
                                                root.get(field),
                                                field.equals("status")
                                                        ? OfferStatus.valueOf(value)
                                                        : UUID.fromString(value)));
            }
        return PageResponse.from(
                offers.findAll(
                                specification,
                                QueryPaging.page(
                                        filters, Set.of("createdAt", "totalPrice", "expiresAt")))
                        .map(data::summary));
    }
}
