package com.se193262.platform.security;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class CorrelationFilterTest {
    @Test
    void filter_safeOpaqueId_isPropagatedAndCleared() throws Exception {
        var request = new MockHttpServletRequest();
        request.addHeader("X-Correlation-Id", "native-trace.123:abc");
        var response = new MockHttpServletResponse();
        new CorrelationFilter().doFilter(request, response, (req, res) -> {
            assertEquals("native-trace.123:abc", CorrelationIds.currentOrNew());
            assertEquals("native-trace.123:abc", MDC.get("correlationId"));
        });
        assertEquals("native-trace.123:abc", response.getHeader("X-Correlation-Id"));
        assertNull(MDC.get("correlationId"));
    }

    @Test
    void filter_unsafeOrMissingId_generatesSafeTraceWithoutInventingRequiredRequestHeader() throws Exception {
        for (String unsafe : new String[]{null, "", "a".repeat(129), "new\r\nlog", "space id"}) {
            var request = new MockHttpServletRequest();
            if (unsafe != null) request.addHeader("X-Correlation-Id", unsafe);
            var response = new MockHttpServletResponse();
            new CorrelationFilter().doFilter(request, response, (req, res) -> {
                assertNotNull(UUID.fromString(CorrelationIds.currentOrNew()));
                assertEquals(unsafe, ((jakarta.servlet.http.HttpServletRequest) req).getHeader("X-Correlation-Id"));
            });
            assertNotNull(UUID.fromString(response.getHeader("X-Correlation-Id")));
            assertNull(MDC.get("correlationId"));
        }
        assertTrue(CorrelationIds.valid("a".repeat(128)));
    }
}
