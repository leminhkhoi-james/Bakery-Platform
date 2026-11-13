package com.se193262.orderservice.feature.order;

public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException() {
        super("Order not found");
    }
}