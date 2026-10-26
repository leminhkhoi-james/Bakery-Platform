package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.OrderResponse;
import com.se193262.orderservice.feature.review.OrderReview;
import com.se193262.orderservice.feature.review.dto.ReviewResponse;

import java.util.List;

public final class OrderResponseMapper {

    private OrderResponseMapper() {
    }

        public static OrderResponse toResponse(CustomerOrder order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderResponse.OrderItemResponse(
                        item.getId(),
                        item.getSourceProductId(),
                        item.getSourceOfferItemId(),
                        item.getItemType().name(),
                        item.getNameSnapshot(),
                        item.getDescriptionSnapshot(),
                        item.getConfigurationSnapshot(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()))
                .toList();
        DeliveryAddressSnapshot address = order.getDeliveryAddressSnapshot();
        OrderResponse.DeliveryAddressResponse deliveryAddress = address == null ? null
                : new OrderResponse.DeliveryAddressResponse(
                        address.getRecipientName(), address.getRecipientPhone(), address.getAddressLine(),
                        address.getWard(), address.getDistrict(), address.getCity(), address.getLatitude(),
                        address.getLongitude(), address.getDeliveryNote());
        List<OrderResponse.OrderStatusHistoryResponse> history = order.getStatusHistory().stream()
                .map(item -> new OrderResponse.OrderStatusHistoryResponse(
                        item.getFromStatus() == null ? null : item.getFromStatus().name(),
                        item.getToStatus().name(), item.getChangedBy(), item.getNote(), item.getChangedAt()))
                .toList();
        OrderReview review = order.getReview();
        ReviewResponse reviewResponse = review == null ? null : new ReviewResponse(
                review.getId(), review.getCustomerId(), review.getRating(), review.getComment(),
                review.getStatus(), review.getCreatedAt(), review.getUpdatedAt());

        return new OrderResponse(
                order.getId(), order.getOrderNumber(), order.getCustomerId(), order.getBakeryId(),
                order.getCakeRequestId(), order.getOfferId(), order.getOrderSource(),
                order.getCustomerNameSnapshot(), order.getCustomerPhoneSnapshot(), order.getBakeryNameSnapshot(),
                order.getCustomerNote(), order.getSubtotal(), order.getDeliveryFee(), order.getTotalAmount(),
                order.getCurrency(), order.getStatus(), order.getNeededAt(), order.getAcceptedAt(),
                order.getCompletedAt(), order.getCreatedAt(), order.getUpdatedAt(), items,
                deliveryAddress, history, reviewResponse);
    }
}