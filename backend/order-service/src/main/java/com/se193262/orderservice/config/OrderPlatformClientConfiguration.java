package com.se193262.orderservice.config;

import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.config.RemoteProperties;
import com.se193262.platform.security.CorrelationFilter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@EnableConfigurationProperties(RemoteProperties.class)
@Import(CorrelationFilter.class)
public class OrderPlatformClientConfiguration {

    @Bean
    ServiceHttpClient serviceHttpClient(RemoteProperties properties) {
        return new ServiceHttpClient(properties);
    }
}