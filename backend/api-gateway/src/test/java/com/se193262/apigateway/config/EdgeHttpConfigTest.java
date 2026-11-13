package com.se193262.apigateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import static org.assertj.core.api.Assertions.assertThat;

class EdgeHttpConfigTest {
    @Test
    void approvedPreflight_hasCredentialedCorsHeaders() throws Exception {
        var request = new MockHttpServletRequest("OPTIONS", "/identity/api/v1/auth/me");
        request.addHeader("Origin", "http://localhost:5173");
        request.addHeader("Access-Control-Request-Method", "GET");
        request.addHeader("Access-Control-Request-Headers", "authorization,idempotency-key");
        var response = new MockHttpServletResponse();
        new PreflightCorsConfig().preflightCorsFilter("http://localhost:5173").getFilter()
                .doFilter(request, response, (req,res) -> { throw new AssertionError("Preflight must terminate at edge"); });
        assertThat(response.getHeader("Access-Control-Allow-Origin")).isEqualTo("http://localhost:5173");
        assertThat(response.getHeader("Access-Control-Allow-Credentials")).isEqualTo("true");
        assertThat(response.getHeader("Access-Control-Allow-Headers")).containsIgnoringCase("authorization");
    }

    @Test
    void unapprovedPreflight_isRejected() throws Exception {
        var request = new MockHttpServletRequest("OPTIONS", "/identity/api/v1/auth/me");
        request.addHeader("Origin", "https://unapproved.example");
        request.addHeader("Access-Control-Request-Method", "GET");
        var response = new MockHttpServletResponse();
        new PreflightCorsConfig().preflightCorsFilter("http://localhost:5173").getFilter()
                .doFilter(request, response, (req,res) -> { throw new AssertionError("Must reject"); });
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getHeader("Access-Control-Allow-Origin")).isNull();
    }

    @Test
    void transportErrors_areDistinctFromBusinessFailures() {
        assertThat(UpstreamFailureFilter.transportStatus(new RuntimeException(new ConnectException()))).isEqualTo(502);
        assertThat(UpstreamFailureFilter.transportStatus(new RuntimeException(new SocketTimeoutException()))).isEqualTo(504);
        assertThat(UpstreamFailureFilter.transportStatus(new RuntimeException(new java.net.http.HttpTimeoutException("native timeout")))).isEqualTo(504);
        assertThat(UpstreamFailureFilter.transportStatus(new IllegalArgumentException())).isZero();
    }

    @Test
    void actualResponse_doesNotDuplicateUpstreamCorsHeaders() throws Exception {
        var request = new MockHttpServletRequest("GET", "/identity/api/v1/auth/me");
        var response = new MockHttpServletResponse();
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        new UpstreamFailureFilter().doFilter(request, response, (req,res) -> {
            var http = (jakarta.servlet.http.HttpServletResponse) res;
            http.addHeader("Access-Control-Allow-Origin", "http://localhost:5173");
            http.addHeader("Access-Control-Allow-Credentials", "true");
        });
        assertThat(response.getHeaders("Access-Control-Allow-Origin")).containsExactly("http://localhost:5173");
        assertThat(response.getHeaders("Access-Control-Allow-Credentials")).containsExactly("true");
    }
}
