package com.se193262.subscriptionservice.feature.payment.dto;

import com.se193262.subscriptionservice.feature.subscription.dto.BakerySubscriptionDto;
import com.se193262.subscriptionservice.feature.subscriptionorder.dto.SubscriptionOrderDto;

public record PaymentReviewResponse(BakeryPaymentDto payment, SubscriptionOrderDto order,
                                    BakerySubscriptionDto.Period subscription) { }
