package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.OrderClient.OrderResult;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;

@Component
public class AcceptanceTransactions {
    private final OfferAcceptanceWorkflowRepository workflows;
    private final OfferRepository offers;
    private final CakeRequestReader requests;
    private final MarketplaceAccess access;
    private final CakeRequestData requestData;
    private final OfferTransitions transitions;
    private final Clock clock;

    public AcceptanceTransactions(
            OfferAcceptanceWorkflowRepository workflows,
            OfferRepository offers,
            CakeRequestReader requests,
            MarketplaceAccess access,
            CakeRequestData requestData,
            OfferTransitions transitions,
            Clock clock) {
        this.workflows = workflows;
        this.offers = offers;
        this.requests = requests;
        this.access = access;
        this.requestData = requestData;
        this.transitions = transitions;
        this.clock = clock;
    }

    @Transactional
    public OfferAcceptanceWorkflow reserve(
            UUID offerId, String key, AcceptOfferRequest command, Actor actor) {
        if (!actor.customer()) throw BusinessException.forbidden();
        if (key == null || !key.matches("[A-Za-z0-9._:-]{1,128}"))
            throw new BusinessException(400, "Invalid Idempotency-Key");
        String fingerprint = fingerprint(offerId, command);
        var existing = workflows.findByCustomerIdAndIdempotencyKey(actor.id(), key);
        if (existing.isPresent()) {
            if (!existing.get().getPayloadFingerprint().equals(fingerprint))
                throw BusinessException.conflict();
            return existing.get();
        }
        var offer = offers.findById(offerId).orElseThrow(BusinessException::missing);
        var request = requests.request(offer.getCakeRequestId());
        access.owner(request, actor);
        access.mutable(request);
        Instant now = clock.instant();
        if (offer.getStatus() != OfferStatus.PENDING
                || !offer.getExpiresAt().isAfter(now)
                || request.getStatus() != RequestStatus.OPEN
                || !request.getNeededAt().isAfter(now)) throw BusinessException.conflict();
        access.touch(request, now);
        offer.setUpdatedAt(now);
        var workflow = OfferAcceptanceWorkflow.create();
        workflow.setId(UUID.randomUUID());
        workflow.setCakeRequestId(request.getId());
        workflow.setOfferId(offerId);
        workflow.setCustomerId(actor.id());
        workflow.setIdempotencyKey(key);
        workflow.setPayloadFingerprint(fingerprint);
        workflow.setDeliveryAddressId(command.deliveryAddressId());
        workflow.setCustomerNote(command.customerNote());
        workflow.setStatus(AcceptanceStatus.PREPARED);
        workflow.setAttemptCount(0);
        workflow.setNextRetryAt(now);
        workflow.setCreatedAt(now);
        workflow.setUpdatedAt(now);
        return workflows.saveAndFlush(workflow);
    }

    static String fingerprint(UUID offer, AcceptOfferRequest command) {
        try {
            String note = command.customerNote();
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(
                                            (offer
                                                            + "|"
                                                            + command.deliveryAddressId()
                                                            + "|"
                                                            + (note == null
                                                                    ? "-1:"
                                                                    : note.length() + ":" + note))
                                                    .getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    @Transactional
    public OfferAcceptanceWorkflow claim(UUID id, UUID owner) {
        Instant now = clock.instant();
        int claimed =
                workflows.claim(
                        id,
                        owner,
                        now.plusSeconds(30),
                        now,
                        List.of(AcceptanceStatus.PREPARED, AcceptanceStatus.RETRYING));
        if (claimed == 0) return null;
        return workflows.findById(id).orElseThrow();
    }

    @Transactional
    public AcceptanceResponse complete(UUID id, UUID owner, OrderResult result) {
        var workflow = workflows.findById(id).orElseThrow();
        if (workflow.getStatus() == AcceptanceStatus.SUCCEEDED) return response(workflow);
        if (!owner.equals(workflow.getLeaseOwner())) throw BusinessException.unavailable();
        var request = requests.request(workflow.getCakeRequestId());
        var selected = offers.findById(workflow.getOfferId()).orElseThrow();
        transitions.change(
                selected, OfferStatus.ACCEPTED, workflow.getCustomerId(), "Offer accepted");
        transitions.pendingTo(
                request.getId(),
                selected.getId(),
                OfferStatus.REJECTED,
                workflow.getCustomerId(),
                "Another offer accepted");
        var previous = request.getStatus();
        request.setStatus(RequestStatus.OFFER_SELECTED);
        access.touch(request, clock.instant());
        requestData.history(
                request, previous, workflow.getCustomerId(), "Offer accepted", clock.instant());
        workflow.setStatus(AcceptanceStatus.SUCCEEDED);
        workflow.setOrderId(result.orderId());
        workflow.setOrderNumber(result.orderNumber());
        workflow.setLeaseOwner(null);
        workflow.setLeaseUntil(null);
        workflow.setUpdatedAt(clock.instant());
        workflows.flush();
        return response(workflow);
    }

    @Transactional
    public void failure(UUID id, UUID owner, int status) {
        var workflow = workflows.findById(id).orElseThrow();
        if (!owner.equals(workflow.getLeaseOwner())
                || workflow.getStatus() == AcceptanceStatus.SUCCEEDED) return;
        workflow.setAttemptCount(workflow.getAttemptCount() + 1);
        workflow.setUpdatedAt(clock.instant());
        workflow.setLeaseOwner(null);
        workflow.setLeaseUntil(null);
        if (status == 422 || status == 404) {
            workflow.setStatus(AcceptanceStatus.FAILED);
            workflow.setErrorStatus(status);
        } else {
            workflow.setStatus(AcceptanceStatus.RETRYING);
            workflow.setNextRetryAt(
                    clock.instant()
                            .plusSeconds(
                                    Math.min(300, 1L << Math.min(workflow.getAttemptCount(), 8))));
        }
    }

    public static AcceptanceResponse response(OfferAcceptanceWorkflow workflow) {
        return new AcceptanceResponse(
                workflow.getOfferId(),
                workflow.getCakeRequestId(),
                workflow.getOrderId(),
                workflow.getOrderNumber(),
                "ACCEPTED",
                "OFFER_SELECTED");
    }
}
