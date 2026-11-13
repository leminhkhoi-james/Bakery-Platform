package com.se193262.platform.config;

import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.exception.PlatformExceptionHandler;
import com.se193262.platform.security.CorrelationFilter;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;

import java.time.Clock;

@Configuration
@Import({
    ResourceSecurityConfiguration.class,
    PlatformExceptionHandler.class,
    ServiceHttpClient.class,
    CorrelationFilter.class
})
@EnableConfigurationProperties({SecurityProperties.class, RemoteProperties.class})
public class PlatformConfiguration {
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
