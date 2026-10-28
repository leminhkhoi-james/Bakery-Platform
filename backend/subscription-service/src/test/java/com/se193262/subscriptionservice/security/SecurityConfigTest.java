package com.se193262.subscriptionservice.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SecurityConfigTest.ProbeController.class)
@Import({SecurityConfig.class, SecurityConfigTest.ProbeController.class,
        SecurityConfigTest.TestBeans.class})
class SecurityConfigTest {

    private static final UUID BAKERY_ID = UUID.fromString("1eed8f30-6d37-419c-8324-cc5c3c68ec64");

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Public plan đọc được không cần JWT")
    void plans_withoutToken_isPublic() throws Exception {
        mockMvc.perform(get("/api/v1/subscription-plans"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin plan từ chối người chưa đăng nhập và bakery owner")
    void adminPlans_withoutAdminUserToken_isRejected() throws Exception {
        mockMvc.perform(get("/api/v1/admin/subscription-plans"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/subscription-plans")
                        .header("Authorization", "Bearer user-owner"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/subscription-plans")
                        .header("Authorization", "Bearer user-admin"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Service JWT không thay thế user JWT khi tạo subscription order")
    void createOrder_withServiceToken_isForbidden() throws Exception {
        String path = "/api/v1/bakeries/" + BAKERY_ID + "/subscription-orders";
        mockMvc.perform(post(path).header("Authorization", "Bearer service-owner"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(path).header("Authorization", "Bearer user-owner"))
                .andExpect(status().isOk());
    }

    @Test
    void entitlement_requiresScopedServiceTokenAndCorrelationId() throws Exception {
        String path = "/internal/v1/subscriptions/bakeries/" + BAKERY_ID + "/entitlement";
        mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(path).header("Authorization", "Bearer user-admin"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(path).header("Authorization", "Bearer service-entitlement"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(path).header("Authorization", "Bearer service-entitlement")
                        .header("X-Correlation-Id", UUID.randomUUID().toString()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Legacy staff JWT cannot create subscription orders")
    void createOrder_withLegacyStaffToken_isForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/bakeries/" + BAKERY_ID + "/subscription-orders")
                        .header("Authorization", "Bearer user-staff"))
                .andExpect(status().isForbidden());
    }

    @RestController
    static class ProbeController {
        @GetMapping("/api/v1/subscription-plans")
        String plans() { return "ok"; }

        @GetMapping("/api/v1/admin/subscription-plans")
        String adminPlans() { return "ok"; }

        @PostMapping("/api/v1/bakeries/{bakeryId}/subscription-orders")
        String createOrder() { return "ok"; }

        @GetMapping("/internal/v1/subscriptions/bakeries/{bakeryId}/entitlement")
        String entitlement() { return "ok"; }
    }

    @TestConfiguration
    static class TestBeans {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> {
                String tokenType = token.startsWith("service") ? "service" : "user";
                String role = token.contains("staff") ? "BAKERY_STAFF"
                        : token.contains("admin") ? "ADMIN" : "BAKERY_OWNER";
                return Jwt.withTokenValue(token)
                        .header("alg", "RS256")
                        .subject(UUID.randomUUID().toString())
                        .claim("token_type", tokenType)
                        .claim("roles", List.of(role))
                        .claim("aud", List.of("subscription-service"))
                        .claim("scope", token.contains("entitlement")
                                ? "subscription:entitlement:read" : "")
                        .build();
            };
        }
    }
}
