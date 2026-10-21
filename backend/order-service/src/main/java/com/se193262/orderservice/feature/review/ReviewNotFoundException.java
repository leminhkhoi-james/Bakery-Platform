package com.se193262.orderservice.feature.review;

public class ReviewNotFoundException extends RuntimeException {

    public ReviewNotFoundException() {
        super("Review not found");
    }
}