package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.CreateCakeRequestRequest;
import com.se193262.marketplaceservice.infrastructure.client.*;
import com.se193262.marketplaceservice.infrastructure.client.CatalogContracts.*;
import com.se193262.platform.exception.BusinessException;

import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;

@Component
public class CakeRequestRules {
    private final BakeryClient bakery;
    private final Clock clock;
    private final jakarta.validation.Validator validator;

    public CakeRequestRules(
            BakeryClient bakery, Clock clock, jakarta.validation.Validator validator) {
        this.bakery = bakery;
        this.clock = clock;
        this.validator = validator;
    }

    public Quote validate(CreateCakeRequestRequest command) {
        if (!validator.validate(command).isEmpty())
            throw BusinessException.invalid("Invalid request fields");
        Instant now = clock.instant();
        if (!command.neededAt().isAfter(now)
                || command.offerDeadline() != null
                        && (!command.offerDeadline().isAfter(now)
                                || !command.offerDeadline().isBefore(command.neededAt())))
            throw BusinessException.invalid("Invalid request deadline");
        if (command.budgetMin() != null
                && command.budgetMax() != null
                && command.budgetMin().compareTo(command.budgetMax()) > 0)
            throw BusinessException.invalid("Invalid budget range");
        if (command.requestType() == RequestType.OPEN_CUSTOM) {
            if (command.targetBakeryId() != null
                    || command.baseProductId() != null
                    || command.optionSelections() != null && !command.optionSelections().isEmpty())
                throw BusinessException.invalid("Open request cannot have product selections");
            return null;
        }
        if (command.targetBakeryId() == null || command.baseProductId() == null)
            throw BusinessException.invalid("Target bakery and product required");
        Quote quote =
                bakery.quote(
                        new QuoteRequest(
                                command.targetBakeryId(),
                                command.baseProductId(),
                                command.deliveryCity(),
                                command.deliveryDistrict(),
                                command.optionSelections(),
                                List.of()));
        if (!quote.customizable()
                || command.neededAt()
                        .isBefore(now.plus(Duration.ofHours(quote.minimumNoticeHours()))))
            throw BusinessException.invalid("Product cannot fulfill customization");
        return quote;
    }
}
