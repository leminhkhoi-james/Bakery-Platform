package com.se193262.apigateway.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Explicit loopback listeners; never bind all network interfaces for local use. */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "gateway.native.dual-loopback", havingValue = "true")
public class NativeLoopbackConfig {
    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> nativeLoopbackListeners(
            @Value("${server.address:}") String address,
            @Value("${server.port:8080}") int port) {
        if (!"127.0.0.1".equals(address) || port < 1 || port > 65535) {
            throw new IllegalArgumentException("Dual loopback requires server.address=127.0.0.1 and a fixed port");
        }
        return factory -> {
            Connector ipv6 = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            ipv6.setProperty("address", "::1");
            ipv6.setPort(port);
            factory.addAdditionalConnectors(ipv6);
        };
    }
}
