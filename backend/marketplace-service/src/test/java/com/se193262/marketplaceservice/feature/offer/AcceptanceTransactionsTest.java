package com.se193262.marketplaceservice.feature.offer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.feature.offer.dto.AcceptOfferRequest;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.junit.jupiter.api.*;
import org.mockito.*;

import java.time.*;
import java.util.*;

class AcceptanceTransactionsTest {
    final OfferAcceptanceWorkflowRepository workflows =
            mock(OfferAcceptanceWorkflowRepository.class);
    final OfferRepository offers = mock(OfferRepository.class);
    final CakeRequestReader requests = mock(CakeRequestReader.class);
    final MarketplaceAccess access = mock(MarketplaceAccess.class);
    final CakeRequestData data = mock(CakeRequestData.class);
    final OfferTransitions transitions = mock(OfferTransitions.class);
    final Instant now = Instant.now();
    final AcceptanceTransactions transactions =
            new AcceptanceTransactions(
                    workflows,
                    offers,
                    requests,
                    access,
                    data,
                    transitions,
                    Clock.fixed(now, ZoneOffset.UTC));

    OfferAcceptanceWorkflow workflow(UUID owner) {
        var w = OfferAcceptanceWorkflow.create();
        w.setId(UUID.randomUUID());
        w.setStatus(AcceptanceStatus.PREPARED);
        w.setLeaseOwner(owner);
        w.setAttemptCount(0);
        return w;
    }

    @Test
    @DisplayName("Ambiguous dependency failure retains the request reservation and schedules retry")
    void failure_timeout_keepsReservation() {
        UUID owner = UUID.randomUUID();
        var w = workflow(owner);
        when(workflows.findById(w.getId())).thenReturn(Optional.of(w));
        transactions.failure(w.getId(), owner, 503);
        assertEquals(AcceptanceStatus.RETRYING, w.getStatus());
        assertTrue(w.getNextRetryAt().isAfter(now));
        assertNull(w.getLeaseOwner());
        assertNull(w.getErrorStatus());
    }

    @Test
    @DisplayName(
            "Definitive address validation failure releases the reservation and records its result")
    void failure_validation_marksFailed() {
        UUID owner = UUID.randomUUID();
        var w = workflow(owner);
        when(workflows.findById(w.getId())).thenReturn(Optional.of(w));
        transactions.failure(w.getId(), owner, 422);
        assertEquals(AcceptanceStatus.FAILED, w.getStatus());
        assertEquals(422, w.getErrorStatus());
    }

    @Test
    @DisplayName("A stale worker cannot overwrite the current worker's result")
    void failure_staleLease_doesNotMutate() {
        var w = workflow(UUID.randomUUID());
        when(workflows.findById(w.getId())).thenReturn(Optional.of(w));
        transactions.failure(w.getId(), UUID.randomUUID(), 503);
        assertEquals(AcceptanceStatus.PREPARED, w.getStatus());
        assertEquals(0, w.getAttemptCount());
    }

    @Test
    @DisplayName("Reusing a key with a different address is rejected before remote work")
    void reserve_keyMismatch_returnsConflict() {
        UUID customer = UUID.randomUUID(), offer = UUID.randomUUID();
        var old = new AcceptOfferRequest(UUID.randomUUID(), null);
        var w = workflow(null);
        w.setPayloadFingerprint(AcceptanceTransactions.fingerprint(offer, old));
        when(workflows.findByCustomerIdAndIdempotencyKey(customer, "key"))
                .thenReturn(Optional.of(w));
        var error =
                assertThrows(
                        BusinessException.class,
                        () ->
                                transactions.reserve(
                                        offer,
                                        "key",
                                        new AcceptOfferRequest(UUID.randomUUID(), null),
                                        new Actor(customer, Set.of("ROLE_CUSTOMER"))));
        assertEquals(409, error.status());
        verifyNoInteractions(offers, requests);
    }

    @Test
    @DisplayName("A changed platform role cannot replay a former customer's selection")
    void reserve_noCustomerRole_isForbidden() {
        var error =
                assertThrows(
                        BusinessException.class,
                        () ->
                                transactions.reserve(
                                        UUID.randomUUID(),
                                        "key",
                                        new AcceptOfferRequest(UUID.randomUUID(), null),
                                        new Actor(UUID.randomUUID(), Set.of("ROLE_BAKERY_OWNER"))));
        assertEquals(403, error.status());
        verifyNoInteractions(workflows);
    }

    @Test
    @DisplayName("Payload fingerprints distinguish omitted notes and literal values")
    void fingerprint_nullAndLiteral_areDifferent() {
        UUID offer = UUID.randomUUID(), address = UUID.randomUUID();
        assertNotEquals(
                AcceptanceTransactions.fingerprint(offer, new AcceptOfferRequest(address, null)),
                AcceptanceTransactions.fingerprint(offer, new AcceptOfferRequest(address, "null")));
        assertNotEquals(
                AcceptanceTransactions.fingerprint(offer, new AcceptOfferRequest(address, null)),
                AcceptanceTransactions.fingerprint(offer, new AcceptOfferRequest(address, "")));
    }
}
