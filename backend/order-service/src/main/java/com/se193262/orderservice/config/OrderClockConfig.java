package com.se193262.orderservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class OrderClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}