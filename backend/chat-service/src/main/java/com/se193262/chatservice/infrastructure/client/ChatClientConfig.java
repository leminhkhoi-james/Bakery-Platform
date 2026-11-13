package com.se193262.chatservice.infrastructure.client;

import com.se193262.chatservice.config.ServiceClientProperties;
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
public class ChatClientConfig {

    @Bean
    MarketplaceChatClient marketplaceChatClient(
            ServiceClientProperties properties, ServiceTokenProvider tokenProvider) {
        return createClient(properties.marketplace(), properties, tokenProvider, MarketplaceChatClient.class);
    }

    @Bean
    BakeryChatClient bakeryChatClient(
            ServiceClientProperties properties, ServiceTokenProvider tokenProvider) {
        return createClient(properties.bakery(), properties, tokenProvider, BakeryChatClient.class);
    }

    private <T> T createClient(
            ServiceClientProperties.Service service,
            ServiceClientProperties properties,
            ServiceTokenProvider tokenProvider,
            Class<T> clientType
    ) {
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
                            tokenProvider.token(service.audience(), service.scope()));
                    return execution.execute(request, body);
                })
                .build();
        HttpServiceProxyFactory proxyFactory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build();
        return proxyFactory.createClient(clientType);
    }
}
