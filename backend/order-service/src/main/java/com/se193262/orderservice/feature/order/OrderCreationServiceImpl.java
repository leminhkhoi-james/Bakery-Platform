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

import java.math.BigDecimal;
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

    public OrderCreationServiceImpl(
            OrderPersistenceService persistenceService,
            IdentityServiceClient identityClient,
            BakeryServiceClient bakeryClient,
            MarketplaceServiceClient marketplaceClient,
            Clock clock) {
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
        try {
            return persistenceService.saveNew(order, operation, customerId, idempotencyKey, payloadHash, now);
        } catch (DataIntegrityViolationException exception) {
            return persistenceService.findReplayAfterConflict(operation, customerId, idempotencyKey, payloadHash)
                    .orElseThrow(() -> new OrderConflictException("Order conflicts with an existing order"));
        }
    }

    private void validateActiveCustomer(IdentityClient.UserResponse customer, UUID expectedCustomerId) {
        if (customer == null || !expectedCustomerId.equals(customer.id()) || !"ACTIVE".equals(customer.status())) {
            throw new InvalidOrderRequestException("Customer account is unavailable");
        }
        if (isBlank(customer.displayName()) || isBlank(customer.phoneNumber())) {
            throw new InvalidOrderRequestException("Customer profile is incomplete");
        }
    }

    private void validateAddress(IdentityClient.AddressResponse address, UUID expectedAddressId) {
        if (address == null || !expectedAddressId.equals(address.id())
                || isBlank(address.recipientName()) || isBlank(address.recipientPhone())
                || isBlank(address.addressLine()) || isBlank(address.district()) || isBlank(address.city())) {
            throw new InvalidOrderRequestException("Delivery address is missing or incomplete");
        }
    }

    private void validateQuote(BakeryClient.CatalogQuoteResponse quote, CreateDirectOrderRequest request, Instant now) {
        if (quote == null || !request.bakeryId().equals(quote.bakeryId())
                || !request.productId().equals(quote.productId())
                || quote.expiresAt() == null || !quote.expiresAt().isAfter(now)
                || quote.items() == null || quote.items().isEmpty()) {
            throw new InvalidOrderRequestException("Bakery quote is invalid or expired");
        }
        if (quote.minimumNoticeHours() < 0
                || request.requestedDeliveryAt().isBefore(now.plusSeconds(quote.minimumNoticeHours() * 3600L))) {
            throw new InvalidOrderRequestException("Requested delivery time does not meet the minimum notice period");
        }
        for (BakeryClient.QuotedItem item : quote.items()) {
            validateItem(item.name(), item.itemType(), item.quantity(), item.unitPrice(), item.lineTotal());
        }
        validateAmounts(quote.subtotal(), quote.deliveryFee(), quote.totalAmount(), quote.items().stream()
            .map(BakeryClient.QuotedItem::lineTotal).toList());
    }

    private void validateOfferSnapshot(
            MarketplaceClient.AcceptedOfferOrderSourceResponse offer, CreateOfferOrderRequest request) {
        if (offer == null || offer.customerId() == null || !request.offerId().equals(offer.offerId())
                || !request.cakeRequestId().equals(offer.cakeRequestId())
                || !request.customerId().equals(offer.customerId())
                || offer.bakeryId() == null || isBlank(offer.bakeryName())) {
            throw new InvalidOrderRequestException("Marketplace offer snapshot does not match the request");
        }
    }

    private void validateOfferAmounts(MarketplaceClient.AcceptedOfferOrderSourceResponse offer) {
        if (offer.items() == null || offer.items().isEmpty()) {
            throw new InvalidOrderRequestException("Accepted offer must contain at least one item");
        }
        for (MarketplaceClient.OfferItemSnapshot item : offer.items()) {
            validateItem(item.name(), item.itemType(), item.quantity(), item.unitPrice(), item.lineTotal());
        }
        validateAmounts(offer.subtotal(), offer.deliveryFee(), offer.totalAmount(), offer.items().stream()
                .map(MarketplaceClient.OfferItemSnapshot::lineTotal).toList());
    }

    private void validateItem(String name, String itemType, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
        parseItemType(itemType);
        if (isBlank(name) || quantity <= 0 || unitPrice == null || lineTotal == null
                || unitPrice.signum() < 0 || lineTotal.compareTo(unitPrice.multiply(BigDecimal.valueOf(quantity))) != 0) {
            throw new InvalidOrderRequestException("Order item snapshot is invalid");
        }
    }

    private void validateAmounts(
            BigDecimal subtotal, BigDecimal deliveryFee, BigDecimal totalAmount, List<BigDecimal> lineTotals) {
        if (subtotal == null || deliveryFee == null || totalAmount == null
                || subtotal.signum() < 0 || deliveryFee.signum() < 0
                || totalAmount.compareTo(subtotal.add(deliveryFee)) != 0
                || lineTotals.stream().anyMatch(line -> line == null || line.signum() < 0)) {
            throw new InvalidOrderRequestException("Order price snapshot is invalid");
        }
        BigDecimal calculatedSubtotal = lineTotals.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (calculatedSubtotal.compareTo(subtotal) != 0) {
            throw new InvalidOrderRequestException("Order item totals do not match the quoted subtotal");
        }
    }

    private void addQuoteItems(CustomerOrder order, BakeryClient.CatalogQuoteResponse quote, UUID productId) {
        if (quote.items() == null || quote.items().isEmpty()) {
            throw new InvalidOrderRequestException("Bakery quote must contain at least one item");
        }
        for (BakeryClient.QuotedItem item : quote.items()) {
            order.addItem(OrderItem.snapshot(
                    order,
                    "CAKE".equals(item.itemType()) ? productId : null,
                    null,
                    parseItemType(item.itemType()),
                    item.name(),
                    item.description(),
                    item.configuration(),
                    item.quantity(),
                    item.unitPrice(),
                    item.lineTotal()));
        }
    }

    private void addOfferItems(CustomerOrder order, List<MarketplaceClient.OfferItemSnapshot> items) {
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderRequestException("Accepted offer must contain at least one item");
        }
        for (MarketplaceClient.OfferItemSnapshot item : items) {
            order.addItem(OrderItem.snapshot(
                    order,
                    null,
                    item.sourceOfferItemId(),
                    parseItemType(item.itemType()),
                    item.name(),
                    item.description(),
                    item.configuration(),
                    item.quantity(),
                    item.unitPrice(),
                    item.lineTotal()));
        }
    }

    private OrderItemType parseItemType(String itemType) {
        try {
            return OrderItemType.valueOf(itemType);
        } catch (RuntimeException exception) {
            throw new InvalidOrderRequestException("Order snapshot contains an unsupported item type");
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

    private void requireUuid(UUID value, String message) {
        if (value == null) {
            throw new InvalidOrderRequestException(message);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}