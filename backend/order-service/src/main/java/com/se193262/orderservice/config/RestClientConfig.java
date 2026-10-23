package com.se193262.orderservice.config;

import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.BakeryServiceClient;
import com.se193262.orderservice.infrastructure.client.IdentityClient;
import com.se193262.orderservice.infrastructure.client.IdentityServiceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceServiceClient;
import org.slf4j.MDC;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.UUID;

@Configuration
@EnableConfigurationProperties(ServiceClientProperties.class)
public class RestClientConfig {

    @Bean
    IdentityClient identityHttpApi(ServiceClientProperties properties) {
        return createClient(properties.identity().baseUrl(), properties, IdentityClient.class);
    }

    @Bean
    IdentityServiceClient identityServiceClient(IdentityClient identityHttpApi) {
        return new IdentityServiceClient(identityHttpApi);
    }

    @Bean
    BakeryClient bakeryHttpApi(ServiceClientProperties properties) {
        return createClient(properties.bakery().baseUrl(), properties, BakeryClient.class);
    }

    @Bean
    BakeryServiceClient bakeryServiceClient(BakeryClient bakeryHttpApi) {
        return new BakeryServiceClient(bakeryHttpApi);
    }

    @Bean
    MarketplaceClient marketplaceHttpApi(ServiceClientProperties properties) {
        return createClient(properties.marketplace().baseUrl(), properties, MarketplaceClient.class);
    }

    @Bean
    MarketplaceServiceClient marketplaceServiceClient(MarketplaceClient marketplaceHttpApi) {
        return new MarketplaceServiceClient(marketplaceHttpApi);
    }

    private <T> T createClient(String baseUrl, ServiceClientProperties properties, Class<T> clientType) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.connectTimeout())
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());

        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .requestInterceptor((request, body, execution) -> {
                    String correlationId = MDC.get("correlationId");
                    request.getHeaders().set("X-Correlation-Id",
                            correlationId == null || correlationId.isBlank() ? UUID.randomUUID().toString() : correlationId);
                    return execution.execute(request, body);
                })
                .build();
        HttpServiceProxyFactory proxyFactory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build();
        return proxyFactory.createClient(clientType);
    }
}