package com.se193262.platform.config;

import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ControllerCorsTest {
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("testCors",
                java.util.Map.of("BACKEND_CORS_ALLOWED_ORIGINS", "https://frontend.example,http://192.168.1.20:5173")));
        context.register(TestConfiguration.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", jakarta.servlet.Filter.class)).build();
    }

    @AfterEach void close() { context.close(); }

    @Test
    void annotationAllowsConfiguredOriginWithCredentialsAndIdempotencyPreflight() throws Exception {
        mvc.perform(options("/api/v1/cors-test")
                .header("Origin", "https://frontend.example")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,Idempotency-Key,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://frontend.example"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void actualRequestWithoutJwtStillReturnsUnauthorizedWithCorsHeaders() throws Exception {
        mvc.perform(post("/api/v1/cors-test").header("Origin", "http://192.168.1.20:5173"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://192.168.1.20:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void annotationRejectsUnconfiguredOrigin() throws Exception {
        mvc.perform(options("/api/v1/cors-test")
                .header("Origin", "https://unapproved.example")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @EnableWebSecurity
    @Import({ResourceSecurityConfiguration.class, TestController.class})
    static class TestConfiguration {
        @Bean SecurityProperties securityProperties() { return new SecurityProperties("test-service", "http://127.0.0.1:9/jwks", "test-issuer", "test-api"); }
        @Bean RemoteProperties remoteProperties() { return new RemoteProperties(null, null, null, null, null, null, null, null, Duration.ofSeconds(1), Duration.ofSeconds(1)); }
        @Bean ObjectMapper objectMapper() { return mock(ObjectMapper.class); }
    }

    @RestController
    @CrossOrigin(origins = "${BACKEND_CORS_ALLOWED_ORIGINS:http://localhost:5173}", allowCredentials = "true")
    static class TestController {
        @PostMapping("/api/v1/cors-test") String post() { return "protected"; }
    }
}
