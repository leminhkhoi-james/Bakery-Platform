package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderPersistenceService {

    private final CustomerOrderRepository customerOrderRepository;
    private final OrderIdempotencyRepository idempotencyRepository;

    public OrderPersistenceService(
            CustomerOrderRepository customerOrderRepository,
            OrderIdempotencyRepository idempotencyRepository) {
        this.customerOrderRepository = customerOrderRepository;
        this.idempotencyRepository = idempotencyRepository;
    }

    @Transactional(readOnly = true)
    public Optional<OrderCreationResult> findReplay(
            String operation, UUID customerId, UUID idempotencyKey, String payloadHash) {
        return idempotencyRepository
                .findByOperationAndCustomerIdAndIdempotencyKey(operation, customerId, idempotencyKey)
                .map(record -> {
                    if (!record.getPayloadHash().equals(payloadHash)) {
                        throw new OrderConflictException("Idempotency key was already used with a different payload");
                    }
                    return new OrderCreationResult(OrderResponseMapper.toResponse(record.getCustomerOrder()), true);
                });
    }

    @Transactional
    public OrderCreationResult saveNew(
            CustomerOrder order,
            String operation,
            UUID customerId,
            UUID idempotencyKey,
            String payloadHash,
            Instant now) {
        if (order.getOfferId() != null && customerOrderRepository.findByOfferId(order.getOfferId()).isPresent()) {
            throw new OrderConflictException("This offer already has an order");
        }
        CustomerOrder savedOrder = customerOrderRepository.saveAndFlush(order);
        idempotencyRepository.saveAndFlush(OrderIdempotencyRecord.create(
                operation, customerId, idempotencyKey, payloadHash, savedOrder, now));
        return new OrderCreationResult(OrderResponseMapper.toResponse(savedOrder), false);
    }

    @Transactional(readOnly = true)
    public Optional<OrderCreationResult> findReplayAfterConflict(
            String operation, UUID customerId, UUID idempotencyKey, String payloadHash) {
        return findReplay(operation, customerId, idempotencyKey, payloadHash);
    }

    @Transactional(readOnly = true)
    public boolean offerAlreadyHasOrder(UUID offerId) {
        return customerOrderRepository.findByOfferId(offerId).isPresent();
    }
}