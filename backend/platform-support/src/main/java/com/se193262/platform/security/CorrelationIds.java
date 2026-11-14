package com.se193262.platform.security;

import org.slf4j.MDC;
import java.util.UUID;
import java.util.regex.Pattern;

/** Nonsecret tracing identifiers. This never grants identity or scope. */
public final class CorrelationIds {
    public static final String PATTERN = "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$";
    private static final Pattern SAFE = Pattern.compile(PATTERN);
    private CorrelationIds() { }

    public static boolean valid(String value) {
        return value != null && value.length() <= 128 && SAFE.matcher(value).matches();
    }

    public static String currentOrNew() {
        String value = MDC.get("correlationId");
        return valid(value) ? value : UUID.randomUUID().toString();
    }
}
