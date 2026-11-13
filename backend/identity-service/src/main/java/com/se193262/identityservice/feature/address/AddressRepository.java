package com.se193262.identityservice.feature.address;

import com.se193262.identityservice.exception.ResourceNotFoundException;
import com.se193262.identityservice.feature.address.dto.AddressResponse;
import com.se193262.identityservice.feature.address.dto.SaveAddressRequest;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class AddressRepository {
    private final JdbcClient jdbc;
    private static final RowMapper<AddressResponse> MAPPER = (row, index) -> new AddressResponse(
            row.getObject("id", UUID.class), row.getString("label"), row.getString("recipient_name"),
            row.getString("recipient_phone"), row.getString("address_line"), row.getString("ward"),
            row.getString("district"), row.getString("city"), row.getBigDecimal("latitude"),
            row.getBigDecimal("longitude"), row.getBoolean("is_default"));

    public AddressRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public void requireActiveUser(UUID userId, boolean lock) {
        jdbc.sql("SELECT id FROM users WHERE id=:userId AND status='ACTIVE'" + (lock ? " FOR UPDATE" : ""))
                .param("userId", userId).query(UUID.class).optional()
                .orElseThrow(() -> new ResourceNotFoundException("Active user"));
    }

    public List<AddressResponse> list(UUID userId) {
        return jdbc.sql("SELECT * FROM user_addresses WHERE user_id=:userId ORDER BY is_default DESC,created_at,id")
                .param("userId", userId).query(MAPPER).list();
    }

    public AddressResponse get(UUID userId, UUID id) {
        return jdbc.sql("SELECT * FROM user_addresses WHERE user_id=:userId AND id=:id")
                .param("userId", userId).param("id", id).query(MAPPER).optional()
                .orElseThrow(() -> new ResourceNotFoundException("Address"));
    }

    public UUID create(UUID userId, SaveAddressRequest request) {
        return parameters(jdbc.sql("""
                INSERT INTO user_addresses(user_id,label,recipient_name,recipient_phone,address_line,
                    ward,district,city,latitude,longitude,is_default)
                VALUES(:userId,:label,:recipientName,:recipientPhone,:addressLine,:ward,:district,:city,
                    :latitude,:longitude,:isDefault) RETURNING id
                """), userId, request).query(UUID.class).single();
    }

    public void update(UUID userId, UUID id, SaveAddressRequest request) {
        parameters(jdbc.sql("""
                UPDATE user_addresses SET label=:label,recipient_name=:recipientName,
                    recipient_phone=:recipientPhone,address_line=:addressLine,ward=:ward,district=:district,
                    city=:city,latitude=:latitude,longitude=:longitude,is_default=:isDefault,
                    updated_at=CURRENT_TIMESTAMP WHERE user_id=:userId AND id=:id
                """), userId, request).param("id", id).update();
    }

    public void clearDefault(UUID userId) {
        jdbc.sql("UPDATE user_addresses SET is_default=FALSE,updated_at=CURRENT_TIMESTAMP WHERE user_id=:userId AND is_default")
                .param("userId", userId).update();
    }

    public void delete(UUID userId, UUID id) {
        jdbc.sql("DELETE FROM user_addresses WHERE user_id=:userId AND id=:id")
                .param("userId", userId).param("id", id).update();
    }

    private JdbcClient.StatementSpec parameters(JdbcClient.StatementSpec statement, UUID userId, SaveAddressRequest request) {
        return statement.param("userId", userId).param("label", request.label().trim())
                .param("recipientName", request.recipientName().trim()).param("recipientPhone", request.recipientPhone().trim())
                .param("addressLine", request.addressLine().trim()).param("ward", request.ward())
                .param("district", request.district().trim()).param("city", request.city().trim())
                .param("latitude", request.latitude()).param("longitude", request.longitude())
                .param("isDefault", Boolean.TRUE.equals(request.isDefault()));
    }
}
