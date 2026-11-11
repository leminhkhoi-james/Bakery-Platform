package com.se193262.apigateway.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration(proxyBeanMethods = false)
public class EdgeHttpConfig {
    @Bean
    FilterRegistrationBean<UpstreamFailureFilter> upstreamFailures() {
        FilterRegistrationBean<UpstreamFailureFilter> registration =
                new FilterRegistrationBean<>(new UpstreamFailureFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
        return registration;
    }
}
