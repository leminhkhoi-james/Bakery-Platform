package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.*;
import com.se193262.marketplaceservice.feature.offer.*;
import com.se193262.marketplaceservice.infrastructure.client.*;
import com.se193262.marketplaceservice.shared.QueryPaging;
import com.se193262.marketplaceservice.shared.dto.PageResponse;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import java.time.*;
import java.util.*;

@Service
public class CakeRequestServiceImpl implements CakeRequestService {
    private final CakeRequestRepository requests;
    private final CakeRequestReader reader;
    private final MarketplaceAccess access;
    private final CakeRequestRules rules;
    private final CakeRequestData data;
    private final CakeRequestMapper mapper;
    private final CakeAiClient ai;
    private final RequestImageRepository images;
    private final OfferRepository offers;
    private final OfferTransitions transitions;
    private final ObjectMapper json;
    private final Clock clock;

    public CakeRequestServiceImpl(
            CakeRequestRepository requests,
            CakeRequestReader reader,
            MarketplaceAccess access,
            CakeRequestRules rules,
            CakeRequestData data,
            CakeRequestMapper mapper,
            CakeAiClient ai,
            RequestImageRepository images,
            OfferRepository offers,
            OfferTransitions transitions,
            ObjectMapper json,
            Clock clock) {
        this.requests = requests;
        this.reader = reader;
        this.access = access;
        this.rules = rules;
        this.data = data;
        this.mapper = mapper;
        this.ai = ai;
        this.images = images;
        this.offers = offers;
        this.transitions = transitions;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public CakeRequestResponse create(CreateCakeRequestRequest command) {
        Actor actor = Actor.current();
        if (!actor.customer()) throw BusinessException.forbidden();
        var quote = rules.validate(command);
        var request = CakeRequest.create();
        request.setId(UUID.randomUUID());
        request.setCustomerId(actor.id());
        mapper.apply(request, command);
        request.setStatus(RequestStatus.DRAFT);
        request.setCreatedAt(clock.instant());
        access.touch(request, clock.instant());
        requests.saveAndFlush(request);
        data.configuration(request.getId(), command, quote);
        data.history(request, null, actor.id(), null, clock.instant());
        return reader.detail(request);
    }

    @Transactional
    public CakeRequestResponse patch(UUID id, PatchCakeRequestRequest patch) {
        var actor = Actor.current();
        var request = reader.request(id);
        access.draft(request, actor);
        var changes = patch.changes();
        if (changes == null || changes.isEmpty())
            throw new BusinessException(400, "Patch is empty");
        var current = reader.command(request);
        @SuppressWarnings("unchecked")
        Map<String, Object> merged = json.convertValue(current, Map.class);
        if (!merged.keySet().containsAll(changes.keySet()))
            throw new BusinessException(400, "Unsupported patch field");
        merged.putAll(changes);
        CreateCakeRequestRequest command;
        try {
            command = json.convertValue(merged, CreateCakeRequestRequest.class);
        } catch (Exception error) {
            throw new BusinessException(400, "Invalid patch");
        }
        if (command.requestType() != request.getRequestType()
                && (!images.findTop100ByCakeRequestIdOrderByDisplayOrderAsc(id).isEmpty()
                        || offers.existsByCakeRequestId(id)
                        || ai.hasJobs(id))) throw BusinessException.conflict();
        var quote = rules.validate(command);
        mapper.apply(request, command);
        access.touch(request, clock.instant());
        data.configuration(id, command, quote);
        requests.flush();
        return reader.detail(request);
    }

    @Transactional(readOnly = true)
    public CakeRequestResponse detail(UUID id) {
        var request = reader.request(id);
        var actor = Actor.current();
        boolean owner = actor.customer() && request.getCustomerId().equals(actor.id());
        if (!actor.admin()
                && !owner
                && !requests.exists(
                        access.visible(actor, null)
                                .and((root, q, b) -> b.equal(root.get("id"), id))))
            throw BusinessException.forbidden();
        return reader.detail(request);
    }

    @Transactional(readOnly = true)
    public PageResponse<CakeRequestSummaryResponse> list(Map<String, String> filters) {
        var actor = Actor.current();
        String scope =
                filters.getOrDefault(
                        "scope", actor.customer() ? "mine" : actor.bakery() ? "available" : null);
        Specification<CakeRequest> specification = access.visible(actor, scope);
        for (String field :
                List.of("status", "requestType", "city", "district", "neededFrom", "neededTo")) {
            String value = filters.get(field);
            if (value == null) continue;
            specification =
                    specification.and(
                            (root, query, b) ->
                                    switch (field) {
                                        case "status" ->
                                                b.equal(
                                                        root.get("status"),
                                                        RequestStatus.valueOf(value));
                                        case "requestType" ->
                                                b.equal(
                                                        root.get("requestType"),
                                                        RequestType.valueOf(value));
                                        case "city" ->
                                                b.equal(
                                                        b.lower(root.get("deliveryCity")),
                                                        value.toLowerCase(Locale.ROOT));
                                        case "district" ->
                                                b.equal(
                                                        b.lower(root.get("deliveryDistrict")),
                                                        value.toLowerCase(Locale.ROOT));
                                        case "neededFrom" ->
                                                b.greaterThanOrEqualTo(
                                                        root.get("neededAt"), Instant.parse(value));
                                        default ->
                                                b.lessThanOrEqualTo(
                                                        root.get("neededAt"), Instant.parse(value));
                                    });
        }
        return PageResponse.from(
                requests.findAll(
                                specification,
                                QueryPaging.page(
                                        filters,
                                        Set.of("createdAt", "neededAt", "budgetMin", "budgetMax")))
                        .map(mapper::summary));
    }

    @Transactional
    public CakeRequestResponse publish(UUID id) {
        var actor = Actor.current();
        var request = reader.request(id);
        access.draft(request, actor);
        rules.validate(reader.command(request));
        request.setStatus(RequestStatus.OPEN);
        access.touch(request, clock.instant());
        data.history(request, RequestStatus.DRAFT, actor.id(), null, clock.instant());
        requests.flush();
        return reader.detail(request);
    }

    @Transactional
    public CakeRequestResponse cancel(UUID id, String reason) {
        var actor = Actor.current();
        var request = reader.request(id);
        access.owner(request, actor);
        access.mutable(request);
        if (request.getStatus() != RequestStatus.DRAFT && request.getStatus() != RequestStatus.OPEN)
            throw BusinessException.conflict();
        var previous = request.getStatus();
        request.setStatus(RequestStatus.CANCELLED);
        access.touch(request, clock.instant());
        transitions.pendingTo(id, null, OfferStatus.REJECTED, actor.id(), reason);
        data.history(request, previous, actor.id(), reason, clock.instant());
        requests.flush();
        return reader.detail(request);
    }

    @Transactional
    public CakeRequestResponse selectDesign(UUID id, UUID designId) {
        var actor = Actor.current();
        var request = reader.request(id);
        access.owner(request, actor);
        access.mutable(request);
        if (request.getStatus() == RequestStatus.CLOSED
                || request.getStatus() == RequestStatus.CANCELLED)
            throw BusinessException.conflict();
        var design = ai.validate(designId, actor.id(), id);
        if (!design.exists()
                || !design.ownerMatches()
                || !design.requestMatches()
                || !"APPROVED".equals(design.moderationStatus())
                || !"SUCCEEDED".equals(design.jobStatus()))
            throw BusinessException.invalid("Design cannot be selected");
        request.setSelectedDesignId(designId);
        access.touch(request, clock.instant());
        requests.flush();
        return reader.detail(request);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> context(UUID id) {
        var request = reader.request(id);
        Map<String, Object> context = new HashMap<>();
        context.put("id", id);
        context.put("customerId", request.getCustomerId());
        context.put("targetBakeryId", request.getTargetBakeryId());
        context.put("status", request.getStatus());
        context.put(
                "chatEligible",
                request.getStatus() != RequestStatus.DRAFT
                        && request.getStatus() != RequestStatus.CANCELLED);
        context.put(
                "aiEligible",
                request.getStatus() == RequestStatus.DRAFT
                        || request.getStatus() == RequestStatus.OPEN);
        return context;
    }
}
