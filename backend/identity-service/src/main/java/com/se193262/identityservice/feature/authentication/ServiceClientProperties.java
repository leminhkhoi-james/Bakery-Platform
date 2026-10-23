package com.se193262.identityservice.feature.authentication;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.*;

@ConfigurationProperties("security.service-clients")
public record ServiceClientProperties(Map<String, Client> clients) {
    public record Client(String secretHash, Map<String, String> grants) {}
}
