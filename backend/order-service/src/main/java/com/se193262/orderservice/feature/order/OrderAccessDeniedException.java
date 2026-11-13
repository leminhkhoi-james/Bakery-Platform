package com.se193262.orderservice.feature.order;

public class OrderAccessDeniedException extends RuntimeException {

    public OrderAccessDeniedException() {
        super("You are not allowed to access this order");
    }
}