package com.se193262.apigateway.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

/** Map transport failures only; preserve downstream business HTTP responses. */
public class UpstreamFailureFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            // CORS is decided at the edge. Do not append an upstream copy to it.
            HttpServletResponseWrapper headers = new HttpServletResponseWrapper(response) {
                private boolean edgeAlreadySet(String name) {
                    return ("Access-Control-Allow-Origin".equalsIgnoreCase(name)
                            || "Access-Control-Allow-Credentials".equalsIgnoreCase(name))
                            && containsHeader(name);
                }
                @Override public void addHeader(String name, String value) {
                    if (!edgeAlreadySet(name)) super.addHeader(name, value);
                }
                @Override public void setHeader(String name, String value) {
                    if (!edgeAlreadySet(name)) super.setHeader(name, value);
                }
            };
            chain.doFilter(request, headers);
        } catch (ServletException | IOException | RuntimeException failure) {
            int status = transportStatus(failure);
            if (status == 0 || response.isCommitted()) throw failure;
            response.resetBuffer();
            response.setStatus(status);
            response.setContentType("application/json");
            response.getWriter().write("{\"statusCode\":" + status + ",\"message\":\"Upstream service unavailable\",\"data\":null}");
        }
    }

    static int transportStatus(Throwable failure) {
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof SocketTimeoutException || cause instanceof java.net.http.HttpTimeoutException) return 504;
            if (cause instanceof ConnectException || cause instanceof NoRouteToHostException
                    || cause instanceof UnknownHostException) return 502;
            if (cause == cause.getCause()) break;
        }
        return 0;
    }
}
