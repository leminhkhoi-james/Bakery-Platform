package com.se193262.bakeryservice;

import com.se193262.platform.config.PlatformConfiguration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@Import(PlatformConfiguration.class)
@EnableScheduling
public class BakeryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BakeryServiceApplication.class, args);
    }
}
