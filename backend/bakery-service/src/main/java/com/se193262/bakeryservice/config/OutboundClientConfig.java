package com.se193262.bakeryservice.config;

import com.se193262.platform.client.ServiceHttpClient;
import com.se193262.platform.config.RemoteProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@EnableConfigurationProperties(RemoteProperties.class)
@Import(ServiceHttpClient.class)
public class OutboundClientConfig { }
