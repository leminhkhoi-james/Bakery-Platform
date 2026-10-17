package com.se193262.identityservice.feature.authentication;

import com.nimbusds.jose.jwk.RSAKey;
import com.se193262.identityservice.AbstractPostgresIntegrationTest;
import com.se193262.identityservice.config.JwtProperties;
import com.se193262.identityservice.feature.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationControllerTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private RSAKey rsaKey;

    @Autowired
    private JwtProperties jwtProperties;

    @BeforeEach
    void cleanUsers() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Register, login, me, refresh rotation và logout hoạt động end-to-end")
    void authenticationFlow_validRequests_succeeds() throws Exception {
        registerCustomer();
        MvcResult login = loginCustomer();
        Cookie originalRefresh = login.getResponse().getCookie("refresh_token");
        String accessToken = accessToken(login);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("customer@example.com"))
                .andExpect(jsonPath("$.data.roles", hasItem("CUSTOMER")));

        MvcResult refresh = mockMvc.perform(post("/api/v1/auth/refresh").cookie(originalRefresh))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andReturn();
        Cookie rotatedRefresh = refresh.getResponse().getCookie("refresh_token");

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(originalRefresh))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(rotatedRefresh))
                .andExpect(status().isUnauthorized());

        MvcResult secondLogin = loginCustomer();
        Cookie logoutRefresh = secondLogin.getResponse().getCookie("refresh_token");
        String secondAccess = accessToken(secondLogin);
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + secondAccess)
                        .cookie(logoutRefresh))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("refresh_token", 0));
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(logoutRefresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Validation và protected endpoint trả response envelope chuẩn")
    void requests_invalidOrUnauthenticated_returnStandardErrors() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"invalid","password":"short","displayName":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.timestamp").exists());

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.statusCode").value(401));
    }

    @Test
    @DisplayName("JWK endpoint chỉ công bố public RSA parameters")
    void jwkSet_publicRequest_neverExposesPrivateKey() throws Exception {
        mockMvc.perform(get("/.well-known/jwks.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.keys[0].kid").value("test-key"))
                .andExpect(jsonPath("$.keys[0].kty").value("RSA"))
                .andExpect(jsonPath("$.keys[0].d").doesNotExist());
    }

    @Test
    @DisplayName("User và service JWT không thể thay thế lẫn nhau")
    void authorization_tokenTypesAndScopes_areEnforced() throws Exception {
        registerCustomer();
        String userToken = accessToken(loginCustomer());
        String serviceToken = serviceToken("identity:user:read");
        String serviceWithoutScope = serviceToken("bakery:profile:read");

        mockMvc.perform(get("/internal/v1/users/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/internal/v1/users/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + serviceWithoutScope))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + serviceToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/internal/v1/users/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + serviceToken))
                .andExpect(status().isNotFound());
    }

    private void registerCustomer() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"customer@example.com",
                                  "password":"StrongPass123!",
                                  "displayName":"Customer"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    private MvcResult loginCustomer() throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"customer@example.com","password":"StrongPass123!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andReturn();
    }

    private String accessToken(MvcResult result) throws Exception {
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        return body.get("data").get("accessToken").asText();
    }

    private String serviceToken(String scope) {
        Instant now = Instant.now();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256)
                .keyId(rsaKey.getKeyID())
                .build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtProperties.issuer())
                .subject("bakery-service")
                .audience(List.of(jwtProperties.serviceAudience()))
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60))
                .claim("token_type", "service")
                .claim("scope", scope)
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
