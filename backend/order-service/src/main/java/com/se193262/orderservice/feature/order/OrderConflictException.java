package com.se193262.orderservice.feature.order;

public class OrderConflictException extends RuntimeException {

    public OrderConflictException(String message) {
        super(message);
    }
}