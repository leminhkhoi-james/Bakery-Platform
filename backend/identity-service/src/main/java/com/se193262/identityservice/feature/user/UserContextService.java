package com.se193262.identityservice.feature.user;

import com.se193262.identityservice.exception.ResourceNotFoundException;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class UserContextService {
    private final JdbcClient jdbc;

    public UserContextService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> user(UUID id) {
        Map<String, Object> profile = jdbc.sql(
                        "SELECT id,email,display_name AS \"displayName\",phone_number AS"
                            + " \"phoneNumber\",status FROM users WHERE id=:id AND status='ACTIVE'")
                .param("id", id)
                .query(
                        (row, n) -> {
                            Map<String, Object> result = new HashMap<>();
                            result.put("id", row.getObject("id"));
                            result.put("email", row.getString("email"));
                            result.put("displayName", row.getString("displayName"));
                            result.put("phoneNumber", row.getString("phoneNumber"));
                            result.put("status", row.getString("status"));
                            return result;
                        })
                .optional()
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<String> roles = jdbc.sql("SELECT r.code FROM user_roles ur JOIN roles r ON r.id=ur.role_id"
                        + " WHERE ur.user_id=:id ORDER BY r.code")
                .param("id", id).query(String.class).list();
        profile.put("roles", roles);
        return profile;
    }

    public Map<String, Object> address(UUID userId, UUID addressId) {
        user(userId);
        return jdbc.sql(
                        "SELECT"
                            + " recipient_name,recipient_phone,address_line,ward,district,city,latitude,longitude"
                            + " FROM user_addresses WHERE id=:id AND user_id=:userId")
                .param("id", addressId)
                .param("userId", userId)
                .query(
                        (row, n) -> {
                            Map<String, Object> result = new HashMap<>();
                            for (String field :
                                    List.of(
                                            "recipient_name",
                                            "recipient_phone",
                                            "address_line",
                                            "ward",
                                            "district",
                                            "city",
                                            "latitude",
                                            "longitude")) {
                                String[] parts = field.split("_");
                                String key = parts[0];
                                for (int i = 1; i < parts.length; i++)
                                    key +=
                                            parts[i].substring(0, 1).toUpperCase()
                                                    + parts[i].substring(1);
                                result.put(key, row.getObject(field));
                            }
                            return result;
                        })
                .optional()
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }
}
