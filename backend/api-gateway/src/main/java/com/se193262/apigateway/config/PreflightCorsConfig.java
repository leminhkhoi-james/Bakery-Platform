package com.se193262.apigateway.config;

import java.util.List;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration(proxyBeanMethods = false)
public class PreflightCorsConfig {
    @Bean
    FilterRegistrationBean<CorsFilter> preflightCorsFilter(
            @Value("${gateway.cors.allowed-origins:http://localhost:5173}") String origins) {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim)
                .filter(origin -> !origin.isBlank()).toList());
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control",
                "Idempotency-Key", "X-Correlation-Id"));
        configuration.setExposedHeaders(List.of("X-Correlation-Id", "Allow"));
        configuration.setMaxAge(600L);
        // Apply the same policy to preflight and actual requests. One filter avoids
        // order-dependent policies when upstream and local configurations coexist.
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        var registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
