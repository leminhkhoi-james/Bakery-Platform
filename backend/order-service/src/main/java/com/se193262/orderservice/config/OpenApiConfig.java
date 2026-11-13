package com.se193262.orderservice.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
    @Bean
    OpenApiCustomizer protectedOperations() {
        return api -> {
            if (api.getPaths() == null) return;
            api.getPaths().forEach((path, item) -> item.readOperations().forEach(operation -> {
                operation.setSecurity(java.util.List.of(new SecurityRequirement().addList("bearerAuth")));
                if (path.startsWith("/internal/")) {
                    operation.setDescription("Internal service JWT: order-service audience and endpoint-specific scope required.");
                }
            }));
        };
    }
}
