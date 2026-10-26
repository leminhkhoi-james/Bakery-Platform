package com.se193262.marketplaceservice;

import com.se193262.platform.config.PlatformConfiguration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@Import(PlatformConfiguration.class)
@EnableScheduling
public class MarketplaceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketplaceServiceApplication.class, args);
    }
}
