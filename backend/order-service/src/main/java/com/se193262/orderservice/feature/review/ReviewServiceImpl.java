package com.se193262.orderservice.feature.review;

import com.se193262.orderservice.feature.order.CustomerOrder;
import com.se193262.orderservice.feature.order.CustomerOrderRepository;
import com.se193262.orderservice.feature.order.OrderAuthenticationRequiredException;
import com.se193262.orderservice.feature.order.OrderConflictException;
import com.se193262.orderservice.feature.order.InvalidOrderRequestException;
import com.se193262.orderservice.feature.order.OrderNotFoundException;
import com.se193262.orderservice.feature.order.OrderStatus;
import com.se193262.orderservice.feature.review.dto.CreateReviewRequest;
import com.se193262.orderservice.feature.review.dto.ReviewResponse;
import com.se193262.orderservice.feature.review.dto.UpdateReviewRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.UUID;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final CustomerOrderRepository orderRepository;
    private final OrderReviewRepository reviewRepository;
    private final Clock clock;

    public ReviewServiceImpl(
            CustomerOrderRepository orderRepository,
            OrderReviewRepository reviewRepository,
            Clock clock) {
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.clock = clock;
    }

    @Override
    @Transactional
    public ReviewResponse create(UUID orderId, UUID customerId, CreateReviewRequest request) {
        requireCustomer(customerId);
        CustomerOrder order = orderRepository.findById(orderId).orElseThrow(OrderNotFoundException::new);
        if (!order.getCustomerId().equals(customerId)) {
            throw new OrderNotFoundException();
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new InvalidOrderRequestException("Only completed orders can be reviewed");
        }
        if (reviewRepository.existsById(orderId)) {
            throw new OrderConflictException("Order already has a review");
        }
        try {
            OrderReview review = reviewRepository.saveAndFlush(OrderReview.create(
                    order, customerId, (short) request.rating(), request.comment(), clock.instant()));
            return toResponse(review);
        } catch (DataIntegrityViolationException exception) {
            throw new OrderConflictException("Order already has a review");
        }
    }

    @Override
    @Transactional
    public ReviewResponse update(UUID orderId, UUID customerId, UpdateReviewRequest request) {
        requireCustomer(customerId);
        OrderReview review = findOwnedReview(orderId, customerId);
        review.update((short) request.rating(), request.comment(), clock.instant());
        return toResponse(reviewRepository.saveAndFlush(review));
    }

    @Override
    @Transactional
    public void delete(UUID orderId, UUID customerId) {
        requireCustomer(customerId);
        OrderReview review = findOwnedReview(orderId, customerId);
        review.softDelete(clock.instant());
        reviewRepository.saveAndFlush(review);
    }

    @Override
    @Transactional
    public ReviewResponse moderate(UUID orderId, ReviewStatus status) {
        OrderReview review = reviewRepository.findById(orderId).orElseThrow(ReviewNotFoundException::new);
        review.moderate(status, clock.instant());
        return toResponse(reviewRepository.saveAndFlush(review));
    }

    private OrderReview findOwnedReview(UUID orderId, UUID customerId) {
        return reviewRepository.findByCustomerIdAndId(customerId, orderId)
                .orElseThrow(ReviewNotFoundException::new);
    }

    private void requireCustomer(UUID customerId) {
        if (customerId == null) {
            throw new OrderAuthenticationRequiredException();
        }
    }

    private ReviewResponse toResponse(OrderReview review) {
        return new ReviewResponse(review.getId(), review.getCustomerId(), review.getRating(),
                review.getComment(), review.getStatus(), review.getCreatedAt(), review.getUpdatedAt());
    }
}