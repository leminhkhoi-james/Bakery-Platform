package com.se193262.bakeryservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class BakeryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BakeryServiceApplication.class, args);
    }
}
