package com.se193262.orderservice.feature.order;

public class OrderAuthenticationRequiredException extends RuntimeException {

    public OrderAuthenticationRequiredException() {
        super("A valid customer access token is required to create a direct order");
    }
}