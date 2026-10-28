package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderContextResponse;
import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.feature.order.dto.OrderSummaryResponse;
import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.BakeryServiceClient;
import com.se193262.orderservice.shared.dto.PageResult;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.springframework.util.StringUtils.hasText;

@Service
public class OrderManagementServiceImpl implements OrderManagementService {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final Set<String> BAKERY_ROLES = Set.of("BAKERY_OWNER");

    private final OrderQueryPersistenceService persistenceService;
    private final BakeryServiceClient bakeryClient;

    public OrderManagementServiceImpl(
            OrderQueryPersistenceService persistenceService,
            BakeryServiceClient bakeryClient) {
        this.persistenceService = persistenceService;
        this.bakeryClient = bakeryClient;
    }

    @Override
    public PageResult<OrderSummaryResponse> listOrders(
            UUID actorId,
            Set<String> roles,
            String scope,
            UUID bakeryId,
            OrderStatus status,
            OrderSource orderSource,
            Instant createdFrom,
            Instant createdTo,
            int page,
            int size,
            String sort) {
        if (page < 1 || size < 1 || size > 100) {
            throw new InvalidOrderRequestException("Pagination values are outside the allowed range");
        }
        if (createdFrom != null && createdTo != null && createdFrom.isAfter(createdTo)) {
            throw new InvalidOrderRequestException("createdFrom must not be after createdTo");
        }

        Specification<CustomerOrder> specification = Specification.unrestricted();
        String normalizedScope = hasText(scope) ? scope : "mine";
        switch (normalizedScope) {
            case "mine" -> {
                if (!hasRole(roles, "CUSTOMER") && !hasRole(roles, ADMIN_ROLE)) {
                    throw new OrderAccessDeniedException();
                }
                requireActor(actorId);
                specification = specification.and((root, query, builder) -> builder.equal(root.get("customerId"), actorId));
            }
            case "bakery" -> {
                requireActor(actorId);
                if (bakeryId == null) {
                    throw new InvalidOrderRequestException("bakeryId is required for bakery scope");
                }
                if (!hasRole(roles, ADMIN_ROLE)) {
                    requireBakeryRole(roles);
                    requireActiveMembership(bakeryId, actorId);
                }
                specification = specification.and((root, query, builder) -> builder.equal(root.get("bakeryId"), bakeryId));
            }
            case "all" -> {
                if (!hasRole(roles, ADMIN_ROLE)) {
                    throw new OrderAccessDeniedException();
                }
            }
            default -> throw new InvalidOrderRequestException("scope must be mine, bakery, or all");
        }
        if (status != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("status"), status));
        }
        if (orderSource != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("orderSource"), orderSource));
        }
        if (bakeryId != null && "all".equals(normalizedScope)) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("bakeryId"), bakeryId));
        }
        if (createdFrom != null) {
            specification = specification.and((root, query, builder) -> builder.greaterThanOrEqualTo(root.get("createdAt"), createdFrom));
        }
        if (createdTo != null) {
            specification = specification.and((root, query, builder) -> builder.lessThanOrEqualTo(root.get("createdAt"), createdTo));
        }

        return persistenceService.list(specification, page, size, parseSort(sort));
    }

    @Override
    public OrderResponse getOrder(UUID orderId, UUID actorId, Set<String> roles) {
        requireActor(actorId);
        OrderAuthorizationContext context = persistenceService.getAuthorizationContext(orderId);
        authorizeRead(context, actorId, roles);
        return persistenceService.getOrder(orderId);
    }

    @Override
    public OrderResponse transitionOrder(
            UUID orderId, OrderStatus targetStatus, String reason, UUID actorId, Set<String> roles) {
        requireActor(actorId);
        OrderAuthorizationContext context = persistenceService.getAuthorizationContext(orderId);
        if (hasRole(roles, ADMIN_ROLE)) {
            return persistenceService.transition(orderId, targetStatus, reason, actorId);
        }
        if (hasRole(roles, "CUSTOMER") && context.customerId().equals(actorId)) {
            if (targetStatus != OrderStatus.CANCELLED) {
                throw new OrderAccessDeniedException();
            }
            return persistenceService.transition(orderId, targetStatus, reason, actorId);
        }
        requireBakeryRole(roles);
        requireActiveMembership(context.bakeryId(), actorId);
        return persistenceService.transition(orderId, targetStatus, reason, actorId);
    }

    @Override
    public OrderContextResponse getContext(UUID orderId) {
        return persistenceService.getContext(orderId);
    }

    private void authorizeRead(OrderAuthorizationContext context, UUID actorId, Set<String> roles) {
        if (hasRole(roles, ADMIN_ROLE)) {
            return;
        }
        if (hasRole(roles, "CUSTOMER") && context.customerId().equals(actorId)) {
            return;
        }
        requireBakeryRole(roles);
        requireActiveMembership(context.bakeryId(), actorId);
    }

    private void requireActiveMembership(UUID bakeryId, UUID actorId) {
        BakeryClient.MembershipAuthorizationResponse membership =
                bakeryClient.getMembershipAuthorization(bakeryId, actorId, "OWNER");
        if (membership == null || !membership.active() || !membership.authorized()
                || !"OWNER".equals(membership.memberRole())) {
            throw new OrderAccessDeniedException();
        }
    }

    private void requireBakeryRole(Set<String> roles) {
        if (roles == null || roles.stream().noneMatch(BAKERY_ROLES::contains)) {
            throw new OrderAccessDeniedException();
        }
    }

    private boolean hasRole(Set<String> roles, String role) {
        return roles != null && roles.contains(role);
    }

    private void requireActor(UUID actorId) {
        if (actorId == null) {
            throw new OrderAuthenticationRequiredException();
        }
    }

    private Sort parseSort(String sort) {
        String[] parts = sort == null ? new String[0] : sort.split(",", -1);
        if (parts.length != 2) {
            throw new InvalidOrderRequestException("sort must use field,asc|desc format");
        }
        String field = parts[0];
        if (!Set.of("createdAt", "neededAt", "totalAmount", "status", "orderNumber").contains(field)) {
            throw new InvalidOrderRequestException("sort field is not supported");
        }
        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(parts[1]);
        } catch (IllegalArgumentException exception) {
            throw new InvalidOrderRequestException("sort direction must be asc or desc");
        }
        return Sort.by(direction, field);
    }
}
