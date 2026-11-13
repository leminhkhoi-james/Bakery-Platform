package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.CreateDirectOrderRequest;
import com.se193262.orderservice.feature.order.dto.CreateOfferOrderRequest;
import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.IdentityClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceClient;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

final class OrderCreationValidator {
    private OrderCreationValidator() {}

    static void validateActiveCustomer(IdentityClient.UserResponse customer, UUID expectedCustomerId) {
        if (customer == null || !expectedCustomerId.equals(customer.id()) || !"ACTIVE".equals(customer.status())) {
            throw new InvalidOrderRequestException("Customer account is unavailable");
        }
        if (isBlank(customer.displayName()) || isBlank(customer.phoneNumber())) {
            throw new InvalidOrderRequestException("Customer profile is incomplete");
        }
    }

    static void validateAddress(IdentityClient.AddressResponse address, UUID expectedAddressId) {
        if (address == null || !expectedAddressId.equals(address.id())
                || isBlank(address.recipientName()) || isBlank(address.recipientPhone())
                || isBlank(address.addressLine()) || isBlank(address.district()) || isBlank(address.city())) {
            throw new InvalidOrderRequestException("Delivery address is missing or incomplete");
        }
    }

    static void validateQuote(BakeryClient.CatalogQuoteResponse quote, CreateDirectOrderRequest request, Instant now) {
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

    static void validateOfferSnapshot(
            MarketplaceClient.AcceptedOfferOrderSourceResponse offer, CreateOfferOrderRequest request) {
        if (offer == null || offer.customerId() == null || !request.offerId().equals(offer.offerId())
                || !request.cakeRequestId().equals(offer.cakeRequestId())
                || !request.customerId().equals(offer.customerId())
                || offer.bakeryId() == null || isBlank(offer.bakeryName())) {
            throw new InvalidOrderRequestException("Marketplace offer snapshot does not match the request");
        }
    }

    static void validateOfferAmounts(MarketplaceClient.AcceptedOfferOrderSourceResponse offer) {
        if (offer.items() == null || offer.items().isEmpty()) {
            throw new InvalidOrderRequestException("Accepted offer must contain at least one item");
        }
        for (MarketplaceClient.OfferItemSnapshot item : offer.items()) {
            validateItem(item.name(), item.itemType(), item.quantity(), item.unitPrice(), item.lineTotal());
        }
        validateAmounts(offer.subtotal(), offer.deliveryFee(), offer.totalAmount(), offer.items().stream()
                .map(MarketplaceClient.OfferItemSnapshot::lineTotal).toList());
    }

    static void validateItem(String name, String itemType, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
        parseItemType(itemType);
        if (isBlank(name) || quantity <= 0 || unitPrice == null || lineTotal == null
                || unitPrice.signum() < 0 || lineTotal.compareTo(unitPrice.multiply(BigDecimal.valueOf(quantity))) != 0) {
            throw new InvalidOrderRequestException("Order item snapshot is invalid");
        }
    }

    static void validateAmounts(
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

    static OrderItemType parseItemType(String itemType) {
        try {
            return OrderItemType.valueOf(itemType);
        } catch (RuntimeException exception) {
            throw new InvalidOrderRequestException("Order snapshot contains an unsupported item type");
        }
    }

    static void requireUuid(UUID value, String message) {
        if (value == null) {
            throw new InvalidOrderRequestException(message);
        }
    }

    static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
