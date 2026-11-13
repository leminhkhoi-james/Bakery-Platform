package com.se193262.identityservice.exception;

import org.junit.jupiter.api.Test;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import static org.assertj.core.api.Assertions.assertThat;

class UnsupportedMethodTest {
    @Test
    void unsupportedMethod_preserves405AndAllowAndEnvelope() {
        var response = new GlobalExceptionHandler().handleUnsupportedMethod(
                new HttpRequestMethodNotSupportedException("PUT", java.util.List.of("GET")));
        assertThat(response.getStatusCode().value()).isEqualTo(405);
        assertThat(response.getHeaders().getAllow()).containsExactly(org.springframework.http.HttpMethod.GET);
        assertThat(response.getBody().statusCode()).isEqualTo(405);
    }
}
