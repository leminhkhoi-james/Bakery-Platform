package com.se193262.cakeaiservice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(CakeAiProperties.class)
public class CakeAiConfig {}
