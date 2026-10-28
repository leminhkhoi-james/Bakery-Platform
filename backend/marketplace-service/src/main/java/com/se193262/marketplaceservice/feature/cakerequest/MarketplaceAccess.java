package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.offer.*;
import com.se193262.marketplaceservice.infrastructure.client.BakeryClient;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class MarketplaceAccess {
    private final BakeryClient bakery;
    private final OfferAcceptanceWorkflowRepository workflows;

    public MarketplaceAccess(BakeryClient bakery, OfferAcceptanceWorkflowRepository workflows) {
        this.bakery = bakery;
        this.workflows = workflows;
    }

    public void touch(CakeRequest request, java.time.Instant now) {
        // Keep the aggregate dirty even when two commands observe the same clock tick.
        var previous = request.getUpdatedAt();
        request.setUpdatedAt(
                previous != null && !now.isAfter(previous) ? previous.plusNanos(1000) : now);
    }

    public void owner(CakeRequest request, Actor actor) {
        if (!actor.customer() || !request.getCustomerId().equals(actor.id()))
            throw BusinessException.forbidden();
    }

    public void mutable(CakeRequest request) {
        if (workflows.existsByCakeRequestIdAndStatusIn(
                request.getId(), List.of(AcceptanceStatus.PREPARED, AcceptanceStatus.RETRYING)))
            throw BusinessException.conflict();
    }

    public void draft(CakeRequest request, Actor actor) {
        owner(request, actor);
        mutable(request);
        if (request.getStatus() != RequestStatus.DRAFT) throw BusinessException.conflict();
    }

    public void bakeryMember(UUID bakeryId, Actor actor, boolean manage) {
        if (!actor.bakery()) throw BusinessException.forbidden();
        var member = bakery.membership(bakeryId, actor.id());
        if (!member.authorized()
                || !member.active()
                || !"OWNER".equals(member.memberRole()))
            throw BusinessException.forbidden();
    }

    public Specification<CakeRequest> visible(Actor actor, String scope) {
        if (actor.admin()) return (root, query, builder) -> builder.conjunction();
        if (scope != null && !Set.of("mine", "available").contains(scope))
            throw new BusinessException(400, "Invalid scope");
        if ("mine".equals(scope) && !actor.customer()
                || "available".equals(scope) && !actor.bakery())
            throw BusinessException.forbidden();
        var memberships =
                actor.bakery() && !"mine".equals(scope)
                        ? bakery.memberships(actor.id()).stream()
                                .filter(m -> m.active() && m.authorized() && "OWNER".equals(m.memberRole()))
                                .toList()
                        : List
                                .<com.se193262.marketplaceservice.infrastructure.client
                                                .CatalogContracts.Membership>
                                        of();
        var profiles = memberships.stream().map(m -> bakery.bakery(m.bakeryId())).toList();
        return (root, query, builder) -> {
            List<Predicate> permissions = new ArrayList<>();
            if (actor.customer() && !"available".equals(scope))
                permissions.add(builder.equal(root.get("customerId"), actor.id()));
            for (var profile : profiles) {
                List<Predicate> areas = new ArrayList<>();
                for (var area : profile.serviceAreas())
                    areas.add(
                            builder.and(
                                    builder.equal(
                                            builder.lower(root.get("deliveryCity")),
                                            area.city().toLowerCase(Locale.ROOT)),
                                    builder.equal(
                                            builder.lower(root.get("deliveryDistrict")),
                                            area.district().toLowerCase(Locale.ROOT))));
                var eligible =
                        builder.and(
                                builder.equal(root.get("status"), RequestStatus.OPEN),
                                builder.or(
                                        builder.equal(root.get("targetBakeryId"), profile.id()),
                                        builder.and(
                                                builder.isNull(root.get("targetBakeryId")),
                                                builder.or(areas.toArray(Predicate[]::new)))));
                var participated = query.subquery(UUID.class);
                var offer = participated.from(Offer.class);
                participated
                        .select(offer.get("cakeRequestId"))
                        .where(builder.equal(offer.get("bakeryId"), profile.id()));
                if (!"ACTIVE".equals(profile.status())) eligible = builder.disjunction();
                permissions.add(
                        "available".equals(scope)
                                ? eligible
                                : builder.or(eligible, root.get("id").in(participated)));
            }
            return builder.or(permissions.toArray(Predicate[]::new));
        };
    }
}
