package com.se193262.bakeryservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableFeignClients
@EnableScheduling
public class BakeryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BakeryServiceApplication.class, args);
    }
}
