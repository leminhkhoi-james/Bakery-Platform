package com.se193262.identityservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springdoc.core.customizers.OpenApiCustomizer;

import java.util.Set;

@Configuration(proxyBeanMethods = false)
@OpenAPIDefinition(
        info = @Info(
                title = "Bakery Platform Identity Service API",
                version = "v1"
        )
)
@SecurityScheme(
        name = OpenApiConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";

    @Bean
    OpenApiCustomizer protectedOperations() {
        Set<String> publicPost = Set.of("/api/v1/auth/register", "/api/v1/auth/login",
                "/api/v1/auth/refresh", "/internal/v1/auth/service-token");
        return api -> {
            if (api.getPaths() == null) return;
            api.getPaths().forEach((path, item) -> item.readOperationsMap().forEach((method, operation) -> {
                boolean publicOperation = method == io.swagger.v3.oas.models.PathItem.HttpMethod.POST
                        && publicPost.contains(path) || path.equals("/.well-known/jwks.json");
                if (!publicOperation) {
                    operation.setSecurity(java.util.List.of(new io.swagger.v3.oas.models.security.SecurityRequirement()
                            .addList(BEARER_AUTH)));
                }
                if (path.startsWith("/internal/") && !publicOperation) {
                    operation.setDescription("Internal service JWT: identity-service audience and endpoint-specific scope required.");
                }
            }));
        };
    }
}
