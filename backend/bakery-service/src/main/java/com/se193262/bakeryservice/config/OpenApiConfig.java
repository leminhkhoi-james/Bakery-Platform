package com.se193262.bakeryservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration(proxyBeanMethods = false)
@OpenAPIDefinition(info = @Info(title = "Bakery Platform Bakery Service API", version = "v1"))
@SecurityScheme(name = OpenApiConfig.BEARER_AUTH, type = SecuritySchemeType.HTTP,
        scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
    public static final String BEARER_AUTH = "bearerAuth";
    private static final Set<String> PUBLIC_GET_PATHS = Set.of(
            "/api/v1/bakeries", "/api/v1/bakeries/{bakeryId}",
            "/api/v1/products", "/api/v1/products/{productId}");

    @Bean
    OpenApiCustomizer bearerAuthOperations() {
        return openApi -> {
            if (openApi.getPaths() == null) return;
            openApi.getPaths().forEach((path, item) -> item.readOperationsMap().forEach((method, operation) -> {
                if (method != PathItem.HttpMethod.GET || !PUBLIC_GET_PATHS.contains(path)) {
                    operation.addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH));
                }
            }));
        };
    }
}
