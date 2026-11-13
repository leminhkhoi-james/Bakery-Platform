package com.se193262.orderservice.feature.order;

import com.se193262.orderservice.feature.order.dto.*;

public interface OfferOrderService {
    record Creation(OrderCreationResponse response, boolean created) {}

    Creation create(String key, CreateOfferOrderRequest command);
}
