package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.CreateDirectOrderRequest;
import com.se193262.orderservice.feature.order.dto.CreateOfferOrderRequest;
import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.BakeryServiceClient;
import com.se193262.orderservice.infrastructure.client.IdentityClient;
import com.se193262.orderservice.infrastructure.client.IdentityServiceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceServiceClient;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import static com.se193262.orderservice.feature.order.OrderCreationValidator.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderCreationServiceImpl implements OrderCreationService {

    private static final String DIRECT_OPERATION = "DIRECT_CATALOG";
    private static final String OFFER_OPERATION = "ACCEPTED_OFFER";

    private final OrderPersistenceService persistenceService;
    private final IdentityServiceClient identityClient;
    private final BakeryServiceClient bakeryClient;
    private final MarketplaceServiceClient marketplaceClient;
    private final Clock clock;
    private final OrderInventoryService inventory;

    public OrderCreationServiceImpl(
            OrderPersistenceService persistenceService,
            IdentityServiceClient identityClient,
            BakeryServiceClient bakeryClient,
            MarketplaceServiceClient marketplaceClient,
            Clock clock, OrderInventoryService inventory) {
        this.inventory = inventory;
        this.persistenceService = persistenceService;
        this.identityClient = identityClient;
        this.bakeryClient = bakeryClient;
        this.marketplaceClient = marketplaceClient;
        this.clock = clock;
    }

    @Override
    public OrderCreationResult createDirectOrder(
            UUID customerId, UUID idempotencyKey, CreateDirectOrderRequest request) {
        requireUuid(customerId, "Authenticated customer ID is required");
        requireUuid(idempotencyKey, "Idempotency-Key is required");
        String payloadHash = fingerprint(request.toString());
        var replay = persistenceService.findReplay(DIRECT_OPERATION, customerId, idempotencyKey, payloadHash);
        if (replay.isPresent()) {
            return replay.get();
        }

        Instant now = clock.instant();
        IdentityClient.UserResponse customer = identityClient.getUser(customerId);
        validateActiveCustomer(customer, customerId);
        IdentityClient.AddressResponse address = identityClient.getAddress(customerId, request.deliveryAddressId());
        validateAddress(address, request.deliveryAddressId());

        BakeryClient.CatalogQuoteRequest quoteRequest = new BakeryClient.CatalogQuoteRequest(
                request.bakeryId(),
                request.productId(),
                request.quantity(),
                toOptionSelections(request.optionSelections()),
                toAddOnSelections(request.addOns()),
                address.district(),
                address.city());
        BakeryClient.CatalogQuoteResponse quote = bakeryClient.getCatalogQuote(quoteRequest);
        validateQuote(quote, request, now);

        CustomerOrder order = CustomerOrder.create(
                customerId,
                quote.bakeryId(),
                null,
                null,
                OrderSource.DIRECT_CATALOG,
                customer.displayName(),
                customer.phoneNumber(),
                quote.bakeryName(),
                request.customerNote(),
                quote.subtotal(),
                quote.deliveryFee(),
                quote.totalAmount(),
                request.requestedDeliveryAt(),
                now);
        addQuoteItems(order, quote, request.productId());
        order.setDeliveryAddressSnapshot(toAddressSnapshot(order, address, null));
        order.addInitialStatusHistory(customerId, now);
        return persistOrReplay(order, DIRECT_OPERATION, customerId, idempotencyKey, payloadHash, now);
    }

    @Override
    public OrderCreationResult createFromAcceptedOffer(UUID idempotencyKey, CreateOfferOrderRequest request) {
        requireUuid(idempotencyKey, "Idempotency-Key is required");
        String payloadHash = fingerprint(request.toString());
        var replay = persistenceService.findReplay(OFFER_OPERATION, request.customerId(), idempotencyKey, payloadHash);
        if (replay.isPresent()) {
            return replay.get();
        }

        MarketplaceClient.AcceptedOfferOrderSourceResponse offer =
                marketplaceClient.getAcceptedOfferOrderSource(request.offerId());
        validateOfferSnapshot(offer, request);
        if (persistenceService.offerAlreadyHasOrder(request.offerId())) {
            throw new OrderConflictException("This offer already has an order");
        }

        Instant now = clock.instant();
        IdentityClient.UserResponse customer = identityClient.getUser(offer.customerId());
        validateActiveCustomer(customer, offer.customerId());
        IdentityClient.AddressResponse address = identityClient.getAddress(
                offer.customerId(), request.deliveryAddressId());
        validateAddress(address, request.deliveryAddressId());
        validateOfferAmounts(offer);
        if (isBlank(offer.customerName()) || isBlank(offer.customerPhone())) {
            throw new InvalidOrderRequestException("Accepted offer customer snapshot is incomplete");
        }
        if (offer.requestedDeliveryAt() == null || !offer.requestedDeliveryAt().isAfter(now)) {
            throw new InvalidOrderRequestException("Requested delivery time must be in the future");
        }

        CustomerOrder order = CustomerOrder.create(
                offer.customerId(),
                offer.bakeryId(),
                offer.cakeRequestId(),
                offer.offerId(),
                OrderSource.ACCEPTED_OFFER,
                offer.customerName(),
                offer.customerPhone(),
                offer.bakeryName(),
                null,
                offer.subtotal(),
                offer.deliveryFee(),
                offer.totalAmount(),
                offer.requestedDeliveryAt(),
                now);
        addOfferItems(order, offer.items());
        order.setDeliveryAddressSnapshot(toAddressSnapshot(order, address, request.deliveryNote()));
        order.addInitialStatusHistory(offer.customerId(), now);
        return persistOrReplay(order, OFFER_OPERATION, offer.customerId(), idempotencyKey, payloadHash, now);
    }

    private OrderCreationResult persistOrReplay(
            CustomerOrder order,
            String operation,
            UUID customerId,
            UUID idempotencyKey,
            String payloadHash,
            Instant now) {
        var selections = order.getItems().stream().filter(item -> item.getSourceAddOnId() != null)
                .map(item -> new com.se193262.orderservice.infrastructure.client.AddOnInventoryClient.Selection(item.getSourceAddOnId(), item.getQuantity())).toList();
        return inventory.create(order.getBakeryId(), selections, candidateId -> {
            if (candidateId != null) order.setId(candidateId);
            try {
                return persistenceService.saveNew(order, operation, customerId, idempotencyKey, payloadHash, now);
            } catch (DataIntegrityViolationException exception) {
                return persistenceService.findReplayAfterConflict(operation, customerId, idempotencyKey, payloadHash)
                        .orElseThrow(() -> new OrderConflictException("Order conflicts with an existing order"));
            }
        });
    }

    private void addQuoteItems(CustomerOrder order, BakeryClient.CatalogQuoteResponse quote, UUID productId) {
        if (quote.items() == null || quote.items().isEmpty()) {
            throw new InvalidOrderRequestException("Bakery quote must contain at least one item");
        }
        for (BakeryClient.QuotedItem item : quote.items()) {
            OrderItem snapshot = OrderItem.snapshot(
                    order,
                    "CAKE".equals(item.itemType()) ? productId : null,
                    null,
                    parseItemType(item.itemType()),
                    item.name(),
                    item.description(),
                    item.configuration(),
                    item.quantity(),
                    item.unitPrice(),
                    item.lineTotal());
            if ("ADD_ON".equals(item.itemType())) snapshot.setSourceAddOnId(item.sourceId());
            order.addItem(snapshot);
        }
    }

    private void addOfferItems(CustomerOrder order, List<MarketplaceClient.OfferItemSnapshot> items) {
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderRequestException("Accepted offer must contain at least one item");
        }
        for (MarketplaceClient.OfferItemSnapshot item : items) {
            OrderItem snapshot = OrderItem.snapshot(
                    order,
                    null,
                    item.sourceOfferItemId(),
                    parseItemType(item.itemType()),
                    item.name(),
                    item.description(),
                    item.configuration(),
                    item.quantity(),
                    item.unitPrice(),
                    item.lineTotal());
            if ("ADD_ON".equals(item.itemType())) {
                if (item.addOnId() == null) throw new InvalidOrderRequestException("Offer add-on source ID is required");
                snapshot.setSourceAddOnId(item.addOnId());
            }
            order.addItem(snapshot);
        }
    }

    private DeliveryAddressSnapshot toAddressSnapshot(
            CustomerOrder order, IdentityClient.AddressResponse address, String deliveryNote) {
        return DeliveryAddressSnapshot.snapshot(
                order, address.recipientName(), address.recipientPhone(), address.addressLine(), address.ward(),
                address.district(), address.city(), address.latitude(), address.longitude(), deliveryNote);
    }

    private List<BakeryClient.OptionSelection> toOptionSelections(
            List<CreateDirectOrderRequest.OptionSelection> selections) {
        return selections == null ? List.of() : selections.stream()
                .map(selection -> new BakeryClient.OptionSelection(selection.optionGroupId(), selection.optionValueIds()))
                .toList();
    }

    private List<BakeryClient.AddOnSelection> toAddOnSelections(List<CreateDirectOrderRequest.AddOnSelection> addOns) {
        return addOns == null ? List.of() : addOns.stream()
                .map(addOn -> new BakeryClient.AddOnSelection(addOn.addOnId(), addOn.quantity()))
                .toList();
    }

    private String fingerprint(String payload) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

}