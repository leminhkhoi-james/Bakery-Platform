package com.se193262.platform.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
public class CorrelationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String correlation = request.getHeader("X-Correlation-Id");
        try {
            correlation = UUID.fromString(correlation).toString();
        } catch (Exception invalid) {
            correlation = UUID.randomUUID().toString();
        }
        response.setHeader("X-Correlation-Id", correlation);
        MDC.put("correlationId", correlation);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
