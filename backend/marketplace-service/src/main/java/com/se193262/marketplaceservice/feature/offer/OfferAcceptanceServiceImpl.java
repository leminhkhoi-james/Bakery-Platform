package com.se193262.marketplaceservice.feature.offer;

import com.se193262.marketplaceservice.feature.cakerequest.*;
import com.se193262.marketplaceservice.feature.offer.dto.*;
import com.se193262.marketplaceservice.infrastructure.client.OrderClient;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.util.*;

@Service
public class OfferAcceptanceServiceImpl implements OfferAcceptanceService {
    private final AcceptanceTransactions transactions;
    private final OfferAcceptanceWorkflowRepository workflows;
    private final OfferRepository offers;
    private final OfferItemRepository items;
    private final CakeRequestReader requests;
    private final OrderClient orders;
    private final ObjectMapper json;
    private final Clock clock;
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(OfferAcceptanceServiceImpl.class);

    public OfferAcceptanceServiceImpl(
            AcceptanceTransactions transactions,
            OfferAcceptanceWorkflowRepository workflows,
            OfferRepository offers,
            OfferItemRepository items,
            CakeRequestReader requests,
            OrderClient orders,
            ObjectMapper json,
            Clock clock) {
        this.transactions = transactions;
        this.workflows = workflows;
        this.offers = offers;
        this.items = items;
        this.requests = requests;
        this.orders = orders;
        this.json = json;
        this.clock = clock;
    }

    public AcceptanceResponse accept(UUID offerId, String key, AcceptOfferRequest command) {
        var workflow = transactions.reserve(offerId, key, command, Actor.current());
        if (workflow.getStatus() == AcceptanceStatus.SUCCEEDED)
            return AcceptanceTransactions.response(workflow);
        if (workflow.getStatus() == AcceptanceStatus.FAILED)
            throw new BusinessException(workflow.getErrorStatus(), "Acceptance validation failed");
        return execute(workflow.getId());
    }

    private AcceptanceResponse execute(UUID id) {
        UUID owner = UUID.randomUUID();
        var workflow = transactions.claim(id, owner);
        if (workflow == null) throw BusinessException.conflict();
        try {
            var result =
                    orders.create(
                            new OrderClient.CreateOrder(
                                    workflow.getOfferId(),
                                    workflow.getCakeRequestId(),
                                    workflow.getCustomerId(),
                                    workflow.getDeliveryAddressId(),
                                    workflow.getCustomerNote()));
            var response = transactions.complete(id, owner, result);
            log.info(
                    "Offer accepted: offerId={}, orderId={}",
                    workflow.getOfferId(),
                    result.orderId());
            return response;
        } catch (BusinessException error) {
            transactions.failure(id, owner, error.status());
            throw error;
        } catch (RuntimeException error) {
            transactions.failure(id, owner, 503);
            throw BusinessException.unavailable();
        }
    }

    @Transactional(readOnly = true)
    public OfferOrderSource orderSource(UUID offerId) {
        var workflow =
                workflows
                        .findByOfferIdAndStatusIn(
                                offerId,
                                List.of(
                                        AcceptanceStatus.PREPARED,
                                        AcceptanceStatus.RETRYING,
                                        AcceptanceStatus.SUCCEEDED))
                        .orElseThrow(BusinessException::conflict);
        var offer = offers.findById(offerId).orElseThrow(BusinessException::missing);
        var request = requests.request(workflow.getCakeRequestId());
        @SuppressWarnings("unchecked")
        Map<String, Object> configuration = json.convertValue(requests.command(request), Map.class);
        configuration.put("selectedDesignId", request.getSelectedDesignId());
        return new OfferOrderSource(
                offerId,
                request.getId(),
                request.getCustomerId(),
                offer.getBakeryId(),
                request.getTitle(),
                request.getDescription(),
                request.getNeededAt(),
                request.getDeliveryCity(),
                request.getDeliveryDistrict(),
                offer.getCakePrice(),
                offer.getDeliveryFee(),
                offer.getAddOnTotal(),
                offer.getTotalPrice(),
                configuration,
                items.findByOfferIdOrderByIdAsc(offerId).stream()
                        .map(
                                i ->
                                        new OfferOrderSource.Item(
                                                i.getId(),
                                                i.getAddOnId(),
                                                i.getItemNameSnapshot(),
                                                i.getDescriptionSnapshot(),
                                                i.getQuantity(),
                                                i.getUnitPrice(),
                                                i.getLineTotal()))
                        .toList());
    }

    public void recover() {
        for (var workflow :
                workflows.findTop100ByStatusInAndNextRetryAtBefore(
                        List.of(AcceptanceStatus.PREPARED, AcceptanceStatus.RETRYING),
                        clock.instant())) {
            try {
                execute(workflow.getId());
            } catch (RuntimeException error) {
                log.warn("Acceptance recovery deferred: workflowId={}", workflow.getId());
            }
        }
    }
}
