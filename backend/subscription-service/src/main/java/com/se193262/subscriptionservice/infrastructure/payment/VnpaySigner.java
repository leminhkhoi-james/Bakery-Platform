package com.se193262.subscriptionservice.infrastructure.payment;

import com.se193262.subscriptionservice.config.VnpayProperties;
import com.se193262.subscriptionservice.exception.AppException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Component
@EnableConfigurationProperties(VnpayProperties.class)
public class VnpaySigner {
    private final VnpayProperties properties;

    public VnpaySigner(VnpayProperties properties) { this.properties = properties; }

    public void requireConfigured() {
        if (!properties.enabled() || blank(properties.tmnCode()) || blank(properties.hashSecret())
                || blank(properties.returnUrl()) || blank(properties.paymentUrl())
                || properties.timeoutMinutes() < 1 || properties.timeoutMinutes() > 15) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "VNPay is not configured");
        }
    }

    public String query(Map<String, String> fields) {
        return new TreeMap<>(fields).entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("vnp_"))
                .filter(entry -> !entry.getKey().equals("vnp_SecureHash")
                        && !entry.getKey().equals("vnp_SecureHashType") && !blank(entry.getValue()))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    public String sign(Map<String, String> fields) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(properties.hashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(query(fields).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Cannot sign VNPay request", exception);
        }
    }

    public boolean verify(Map<String, String> fields) {
        String signature = fields.get("vnp_SecureHash");
        if (signature == null || !signature.matches("[a-fA-F0-9]{128}")) return false;
        return MessageDigest.isEqual(HexFormat.of().parseHex(sign(fields)), HexFormat.of().parseHex(signature));
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private static boolean blank(String value) { return value == null || value.isBlank(); }
}
