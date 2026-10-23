package com.se193262.marketplaceservice.feature.cakerequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.se193262.marketplaceservice.feature.cakerequest.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.*;
import com.se193262.platform.exception.BusinessException;

import jakarta.validation.Validation;

import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

class CakeRequestRulesTest {
    final BakeryClient bakery = mock(BakeryClient.class);
    final Instant now = Instant.now();
    final jakarta.validation.ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    final CakeRequestRules rules =
            new CakeRequestRules(bakery, Clock.fixed(now, ZoneOffset.UTC), factory.getValidator());

    CreateCakeRequestRequest command(
            RequestType type,
            UUID target,
            UUID product,
            BigDecimal min,
            BigDecimal max,
            Instant deadline) {
        return new CreateCakeRequestRequest(
                type,
                target,
                product,
                "Cake",
                "Description",
                null,
                10,
                min,
                max,
                now.plusSeconds(3600),
                "D1",
                "HCM",
                deadline,
                null,
                List.of());
    }

    @AfterEach
    void close() {
        factory.close();
    }

    @Test
    @DisplayName("Open request rejects foreign product identifiers")
    void validate_openWithTarget_rejects() {
        assertThrows(
                BusinessException.class,
                () ->
                        rules.validate(
                                command(
                                        RequestType.OPEN_CUSTOM,
                                        UUID.randomUUID(),
                                        null,
                                        null,
                                        null,
                                        null)));
        verifyNoInteractions(bakery);
    }

    @Test
    @DisplayName("Budget minimum cannot exceed maximum")
    void validate_reversedBudget_rejects() {
        assertThrows(
                BusinessException.class,
                () ->
                        rules.validate(
                                command(
                                        RequestType.OPEN_CUSTOM,
                                        null,
                                        null,
                                        BigDecimal.TEN,
                                        BigDecimal.ONE,
                                        null)));
    }

    @Test
    @DisplayName("Offer deadline must precede the requested delivery")
    void validate_lateDeadline_rejects() {
        assertThrows(
                BusinessException.class,
                () ->
                        rules.validate(
                                command(
                                        RequestType.OPEN_CUSTOM,
                                        null,
                                        null,
                                        null,
                                        null,
                                        now.plusSeconds(7200))));
    }

    @Test
    @DisplayName("Open request can be created without remote dependencies")
    void validate_openRequest_succeeds() {
        assertNull(rules.validate(command(RequestType.OPEN_CUSTOM, null, null, null, null, null)));
        verifyNoInteractions(bakery);
    }
}
