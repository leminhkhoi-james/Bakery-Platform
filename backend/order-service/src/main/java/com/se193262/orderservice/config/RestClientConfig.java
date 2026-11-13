package com.se193262.orderservice.config;

import com.se193262.orderservice.infrastructure.client.BakeryClient;
import com.se193262.orderservice.infrastructure.client.BakeryServiceClient;
import com.se193262.orderservice.infrastructure.client.IdentityClient;
import com.se193262.orderservice.infrastructure.client.IdentityServiceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceClient;
import com.se193262.orderservice.infrastructure.client.MarketplaceServiceClient;
import com.se193262.platform.client.ServiceHttpClient;
import org.slf4j.MDC;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.net.http.HttpClient;
import java.util.UUID;

@Configuration
@EnableConfigurationProperties(ServiceClientProperties.class)
public class RestClientConfig {

    @Bean
    IdentityClient identityHttpApi(ServiceClientProperties properties, ServiceHttpClient serviceHttpClient) {
        return createClient(properties.identity(), properties, IdentityClient.class,
                serviceHttpClient);
    }

    @Bean
    IdentityServiceClient identityServiceClient(IdentityClient identityHttpApi) {
        return new IdentityServiceClient(identityHttpApi);
    }

    @Bean
    BakeryClient bakeryHttpApi(ServiceClientProperties properties, ServiceHttpClient serviceHttpClient) {
        return createClient(properties.bakery(), properties, BakeryClient.class,
                serviceHttpClient);
    }

    @Bean
    BakeryServiceClient bakeryServiceClient(BakeryClient bakeryHttpApi) {
        return new BakeryServiceClient(bakeryHttpApi);
    }

    @Bean
    MarketplaceClient marketplaceHttpApi(ServiceClientProperties properties, ServiceHttpClient serviceHttpClient) {
        return createClient(properties.marketplace(), properties, MarketplaceClient.class,
                serviceHttpClient);
    }

    @Bean
    MarketplaceServiceClient marketplaceServiceClient(MarketplaceClient marketplaceHttpApi) {
        return new MarketplaceServiceClient(marketplaceHttpApi);
    }

    private <T> T createClient(
            ServiceClientProperties.Service service,
            ServiceClientProperties properties,
            Class<T> clientType,
            ServiceHttpClient serviceHttpClient) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.connectTimeout())
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());

        RestClient restClient = RestClient.builder()
                .baseUrl(service.baseUrl())
                .requestFactory(requestFactory)
                .requestInterceptor((request, body, execution) -> {
                    String correlationId = MDC.get("correlationId");
                    request.getHeaders().set("X-Correlation-Id",
                            correlationId == null || correlationId.isBlank()
                                    ? UUID.randomUUID().toString()
                                    : correlationId);
                    request.getHeaders().setBearerAuth(
                            serviceHttpClient.serviceToken(service.audience(), service.scope()));
                    return execution.execute(request, body);
                })
                .build();
        HttpServiceProxyFactory proxyFactory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build();
        return proxyFactory.createClient(clientType);
    }
}
