package com.se193262.bakeryservice.security;

import com.se193262.bakeryservice.feature.bakery.entity.Bakery;
import com.se193262.bakeryservice.feature.member.entity.BakeryMember;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberRole;
import com.se193262.bakeryservice.feature.member.entity.BakeryMemberStatus;
import com.se193262.bakeryservice.feature.member.repository.BakeryMemberRepository;
import org.junit.jupiter.api.BeforeEach;
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

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SecurityConfigTest.ProbeController.class)
@Import({SecurityConfig.class, SecurityConfigTest.ProbeController.class,
        SecurityConfigTest.TestBeans.class})
class SecurityConfigTest {

    private static final UUID USER_ID = UUID.fromString("46c3d723-6d52-48df-a54b-56cecad8ac83");
    private static final UUID BAKERY_ID = UUID.fromString("1eed8f30-6d37-419c-8324-cc5c3c68ec64");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MemberFixture memberFixture;

    @BeforeEach
    void resetMembership() {
        memberFixture.member = null;
    }

    @Test
    @DisplayName("Tạo bakery cần user JWT có platform role BAKERY_OWNER")
    void create_withoutOwnerUserToken_isRejected() throws Exception {
        mockMvc.perform(post("/api/v1/bakeries"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/bakeries").header("Authorization", "Bearer service-owner"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/bakeries").header("Authorization", "Bearer user-owner"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Chỉ member ACTIVE của đúng bakery được đọc dữ liệu quản lý")
    void products_withoutActiveMembership_isRejected() throws Exception {
        String path = "/api/v1/bakeries/" + BAKERY_ID + "/products";
        mockMvc.perform(get(path).header("Authorization", "Bearer user-owner"))
                .andExpect(status().isForbidden());

        BakeryMember member = new BakeryMember(new Bakery("Test", "0900000000", null),
                USER_ID, BakeryMemberRole.OWNER);
        memberFixture.member = member;
        member.update(null, BakeryMemberStatus.INACTIVE);
        mockMvc.perform(get(path).header("Authorization", "Bearer user-owner"))
                .andExpect(status().isForbidden());
        member.update(null, BakeryMemberStatus.ACTIVE);
        mockMvc.perform(get(path).header("Authorization", "Bearer user-owner"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/bakeries/" + UUID.randomUUID() + "/products")
                        .header("Authorization", "Bearer user-owner"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("JWT staff cũ bị từ chối dù có owner membership")
    void catalog_withLegacyStaffToken_isForbidden() throws Exception {
        BakeryMember member = new BakeryMember(new Bakery("Test", "0900000000", null),
                USER_ID, BakeryMemberRole.OWNER);
        memberFixture.member = member;
        String path = "/api/v1/bakeries/" + BAKERY_ID + "/products";
        mockMvc.perform(get(path).header("Authorization", "Bearer user-staff"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(path).header("Authorization", "Bearer user-staff"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Internal Bakery profile requires a scoped service token and correlation ID")
    void internalProfile_requiresServiceScopeAndCorrelation() throws Exception {
        String path = "/internal/v1/bakeries/" + BAKERY_ID;
        mockMvc.perform(get(path).header("Authorization", "Bearer user-owner")
                        .header("X-Correlation-Id", "request-1"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(path).header("Authorization", "Bearer service-profile"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(path).header("Authorization", "Bearer service-no-scope")
                        .header("X-Correlation-Id", "request-1"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(path).header("Authorization", "Bearer service-profile")
                        .header("X-Correlation-Id", "request-1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Public bakery detail does not require JWT")
    void bakeryDetail_withoutToken_isPublic() throws Exception {
        mockMvc.perform(get("/api/v1/bakeries/" + BAKERY_ID)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Owner cannot use removed member creation endpoint")
    void memberCreate_withOwnerToken_isForbidden() throws Exception {
        memberFixture.member = new BakeryMember(new Bakery("Test", "0900000000", null),
                USER_ID, BakeryMemberRole.OWNER);
        mockMvc.perform(post("/api/v1/bakeries/" + BAKERY_ID + "/members")
                        .header("Authorization", "Bearer user-owner"))
                .andExpect(status().isForbidden());
    }

    @RestController
    static class ProbeController {
        @PostMapping("/api/v1/bakeries")
        String create() { return "ok"; }

        @GetMapping("/api/v1/bakeries/{bakeryId}/products")
        String products() { return "ok"; }

        @PostMapping("/api/v1/bakeries/{bakeryId}/products")
        String createProduct() { return "ok"; }

        @GetMapping("/internal/v1/bakeries/{bakeryId}")
        String internalBakery() { return "ok"; }

        @GetMapping("/api/v1/bakeries/{bakeryId}")
        String publicBakery() { return "ok"; }
    }

    static class MemberFixture {
        BakeryMember member;
    }

    @TestConfiguration
    static class TestBeans {
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> {
                String tokenType = token.startsWith("service") ? "service" : "user";
                String role = token.contains("staff") ? "BAKERY_STAFF" : "BAKERY_OWNER";
                return Jwt.withTokenValue(token)
                        .header("alg", "RS256")
                        .subject(USER_ID.toString())
                        .claim("token_type", tokenType)
                        .claim("roles", List.of(role))
                        .audience(List.of(token.startsWith("service") ? "bakery-service" : "bakery-platform-api"))
                        .claim("scope", token.equals("service-profile") ? "bakery:profile:read" : "")
                        .build();
            };
        }

        @Bean
        MemberFixture memberFixture() {
            return new MemberFixture();
        }

        @Bean
        BakeryMemberRepository memberRepository(MemberFixture fixture) {
            return (BakeryMemberRepository) Proxy.newProxyInstance(
                    BakeryMemberRepository.class.getClassLoader(),
                    new Class<?>[] {BakeryMemberRepository.class},
                    (proxy, method, args) -> {
                        if ("hashCode".equals(method.getName())) {
                            return System.identityHashCode(proxy);
                        }
                        if ("equals".equals(method.getName())) {
                            return proxy == args[0];
                        }
                        if ("toString".equals(method.getName())) {
                            return "BakeryMemberRepository test stub";
                        }
                        if ("findByBakery_IdAndUserId".equals(method.getName())) {
                            return BAKERY_ID.equals(args[0]) && USER_ID.equals(args[1])
                                    ? Optional.ofNullable(fixture.member) : Optional.empty();
                        }
                        throw new UnsupportedOperationException(method.getName());
                    });
        }
    }
}
