package com.se193262.bakeryservice.feature.catalog;

import com.se193262.bakeryservice.feature.catalog.dto.CatalogContracts.*;
import com.se193262.platform.exception.BusinessException;
import com.se193262.bakeryservice.infrastructure.client.SubscriptionEntitlementClient;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class CatalogServiceImpl implements CatalogService {
    private final CatalogRepository repository;
    private final SubscriptionEntitlementClient entitlementClient;

    public CatalogServiceImpl(CatalogRepository repository, SubscriptionEntitlementClient entitlementClient) {
        this.repository = repository;
        this.entitlementClient = entitlementClient;
    }

    public Bakery bakery(UUID id) {
        var row =
                repository.one(
                        "select id,name,status from bakeries where id=:id", Map.of("id", id));
        var areas =
                repository
                        .list(
                                "select city,district,delivery_fee,minimum_order from service_areas"
                                        + " where bakery_id=:id and active=true",
                                Map.of("id", id))
                        .stream()
                        .map(
                                a ->
                                        new Area(
                                                (String) a.get("city"),
                                                (String) a.get("district"),
                                                (BigDecimal) a.get("delivery_fee"),
                                                (BigDecimal) a.get("minimum_order")))
                        .toList();
        return new Bakery(id, (String) row.get("name"), (String) row.get("status"), areas);
    }

    public Membership authorization(UUID bakeryId, UUID userId, String requiredRole) {
        bakery(bakeryId);
        var membership =
                memberships(userId).stream()
                        .filter(m -> m.bakeryId().equals(bakeryId))
                        .findFirst()
                        .orElse(new Membership(bakeryId, userId, false, null, false));
        if (requiredRole == null) return membership;
        if (!Set.of("OWNER", "MANAGER", "STAFF").contains(requiredRole))
            throw new BusinessException(400, "Invalid membership role");
        boolean allowed =
                membership.active()
                        && switch (requiredRole) {
                            case "OWNER" -> "OWNER".equals(membership.memberRole());
                            case "MANAGER" ->
                                    Set.of("OWNER", "MANAGER").contains(membership.memberRole());
                            default -> true;
                        };
        return new Membership(
                bakeryId, userId, membership.active(), membership.memberRole(), allowed);
    }

    public List<Membership> memberships(UUID userId) {
        return repository
                .list(
                        "select bakery_id,member_role from bakery_members where user_id=:id and"
                                + " status='ACTIVE'",
                        Map.of("id", userId))
                .stream()
                .map(
                        m ->
                                new Membership(
                                        (UUID) m.get("bakery_id"),
                                        userId,
                                        true,
                                        (String) m.get("member_role"),
                                        true))
                .toList();
    }

    public Quote quote(QuoteRequest request, boolean productRequired) {
        Bakery bakery = bakery(request.bakeryId());
        if (!"ACTIVE".equals(bakery.status())) throw BusinessException.conflict();
        if (!entitlementClient.hasActiveSubscription(request.bakeryId()))
            throw new BusinessException(409, "Bakery subscription is inactive");
        if (bakery.serviceAreas().stream()
                .noneMatch(
                        a ->
                                a.city().equalsIgnoreCase(request.deliveryCity())
                                        && a.district()
                                                .equalsIgnoreCase(request.deliveryDistrict())))
            throw BusinessException.invalid("Outside service area");
        Map<String, Object> product = null;
        if (productRequired && request.productId() == null)
            throw BusinessException.invalid("Product required");
        if (request.productId() != null) {
            product =
                    repository.one(
                            "select * from products where id=:id and bakery_id=:bakeryId",
                            Map.of("id", request.productId(), "bakeryId", request.bakeryId()));
            if (!"PUBLISHED".equals(product.get("status"))) throw BusinessException.conflict();
        }
        var options = options(request);
        List<ItemSnapshot> items = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        for (AddOn selected : request.addOns() == null ? List.<AddOn>of() : request.addOns()) {
            if (!seen.add(selected.addOnId())) throw BusinessException.invalid("Duplicate add-on");
            var item =
                    repository.one(
                            "select * from add_ons where id=:id and bakery_id=:bakeryId and"
                                    + " active=true",
                            Map.of("id", selected.addOnId(), "bakeryId", request.bakeryId()));
            BigDecimal price = (BigDecimal) item.get("price");
            items.add(
                    new ItemSnapshot(
                            selected.addOnId(),
                            (String) item.get("name"),
                            (String) item.get("description"),
                            selected.quantity(),
                            price,
                            price.multiply(BigDecimal.valueOf(selected.quantity()))));
        }
        return new Quote(
                request.productId(),
                product == null ? null : (String) product.get("name"),
                product != null && Boolean.TRUE.equals(product.get("customizable")),
                product == null ? 0 : (Integer) product.get("minimum_notice_hours"),
                options,
                items,
                items.stream()
                        .map(ItemSnapshot::lineTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private List<OptionSnapshot> options(QuoteRequest request) {
        var selected =
                request.optionSelections() == null ? List.<Option>of() : request.optionSelections();
        if (request.productId() == null && !selected.isEmpty())
            throw BusinessException.invalid("Options require a product");
        List<OptionSnapshot> snapshots = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        Map<UUID, Integer> counts = new HashMap<>();
        for (Option option : selected) {
            if (!seen.add(option.optionValueId()))
                throw BusinessException.invalid("Duplicate option");
            var value =
                    repository.one(
                            "select g.name as group_name,v.name as value_name from"
                                + " product_option_groups g join product_option_values v on"
                                + " v.option_group_id=g.id where g.id=:groupId and v.id=:valueId"
                                + " and g.product_id=:productId and v.active=true",
                            Map.of(
                                    "groupId",
                                    option.optionGroupId(),
                                    "valueId",
                                    option.optionValueId(),
                                    "productId",
                                    request.productId()));
            counts.merge(option.optionGroupId(), 1, Integer::sum);
            snapshots.add(
                    new OptionSnapshot(
                            option.optionGroupId(),
                            option.optionValueId(),
                            (String) value.get("group_name"),
                            (String) value.get("value_name"),
                            option.quantity()));
        }
        if (request.productId() != null)
            for (var group :
                    repository.list(
                            "select * from product_option_groups where product_id=:id",
                            Map.of("id", request.productId()))) {
                int count = counts.getOrDefault((UUID) group.get("id"), 0),
                        min = (Integer) group.get("minimum_selections"),
                        max = (Integer) group.get("maximum_selections");
                if (Boolean.TRUE.equals(group.get("required"))) min = Math.max(1, min);
                if (count < min
                        || count > max
                        || ("SINGLE".equals(group.get("selection_type")) && count > 1))
                    throw BusinessException.invalid("Invalid option selection count");
            }
        return snapshots;
    }
}
