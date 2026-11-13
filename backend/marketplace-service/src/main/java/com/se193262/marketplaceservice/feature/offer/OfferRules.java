package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.*;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.*;
import com.se193262.platform.exception.BusinessException;

import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;

@Component
public class OfferRules {
    private final BakeryClient bakery;
    private final SubscriptionClient subscription;
    private final Clock clock;
    private final jakarta.validation.Validator validator;

    public OfferRules(
            BakeryClient bakery,
            SubscriptionClient subscription,
            Clock clock,
            jakarta.validation.Validator validator) {
        this.bakery = bakery;
        this.subscription = subscription;
        this.clock = clock;
        this.validator = validator;
    }

    public Quote validate(CakeRequest request, CreateOfferRequest command) {
        if (!validator.validate(command).isEmpty())
            throw BusinessException.invalid("Invalid offer fields");
        Instant now = clock.instant();
        if (request.getStatus() != RequestStatus.OPEN
                || !request.getNeededAt().isAfter(now)
                || request.getOfferDeadline() != null && !request.getOfferDeadline().isAfter(now))
            throw BusinessException.invalid("Request no longer accepting offers");
        if (request.getTargetBakeryId() != null
                && !request.getTargetBakeryId().equals(command.bakeryId()))
            throw BusinessException.invalid("Wrong target bakery");
        if (!command.expiresAt().isAfter(now)
                || command.expiresAt().isAfter(request.getNeededAt())
                || !command.estimatedCompletionAt().isAfter(now)
                || command.estimatedCompletionAt().isAfter(request.getNeededAt()))
            throw BusinessException.invalid("Invalid offer dates");
        if (!subscription.active(command.bakeryId()))
            throw BusinessException.invalid("Active subscription required");
        Quote quote =
                bakery.quote(
                        new QuoteRequest(
                                command.bakeryId(),
                                null,
                                request.getDeliveryCity(),
                                request.getDeliveryDistrict(),
                                List.of(),
                                command.items()));
        if (command.cakePrice()
                        .add(command.deliveryFee())
                        .add(quote.addOnTotal())
                        .compareTo(new java.math.BigDecimal("9999999999.99"))
                > 0) throw BusinessException.invalid("Price exceeds supported range");
        return quote;
    }
}
