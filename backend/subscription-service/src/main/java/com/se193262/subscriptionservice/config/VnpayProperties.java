package com.se193262.subscriptionservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("subscription.vnpay")
public record VnpayProperties(boolean enabled, String tmnCode, String hashSecret,
                              String paymentUrl, String returnUrl, int timeoutMinutes) { }
