package com.se193262.identityservice;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers(disabledWithoutDocker = true)
class OwnerOnlyMigrationTest {
    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
    private static final String USER_ID = "00000000-0000-0000-0000-000000000001";
    private static final String BAKERY_ID = "00000000-0000-0000-0000-000000000002";

    @Test
    @DisplayName("Identity retires staff, preserves owner and grants customer without promoting staff")
    void identityMigration_withStaffAssignments_retiresWithoutPromotion() throws Exception {
        migrate("identity-service", "2");
        try (Connection connection = connection("identity-service")) {
            execute(connection, "INSERT INTO users(id,email,password_hash,display_name) VALUES ('"
                    + USER_ID + "','staff@example.test','hash','Former staff')");
            execute(connection, "INSERT INTO user_roles(user_id,role_id) SELECT '" + USER_ID
                    + "',id FROM roles WHERE code='BAKERY_STAFF'");
            migrate("identity-service", null);
            assertEquals(1, count(connection, "retired_platform_role_assignments"));
            assertEquals(0, count(connection, "roles WHERE code='BAKERY_STAFF'"));
            assertEquals(1, count(connection, "user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='CUSTOMER'"));
            assertEquals(0, count(connection, "user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='BAKERY_OWNER'"));
            assertEquals(1, count(connection, "roles WHERE code='BAKERY_OWNER'"));
            assertThrows(SQLException.class, () -> execute(connection,
                    "INSERT INTO roles(id,code) VALUES (10,'BAKERY_STAFF')"));
        }
    }

    @Test
    @DisplayName("Bakery archives legacy memberships, preserves owner and blocks future staff roles")
    void bakeryMigration_withLegacyMembers_keepsOnlyOwner() throws Exception {
        migrate("bakery-service", "1");
        try (Connection connection = connection("bakery-service")) {
            execute(connection, "INSERT INTO bakeries(id,name,phone_number) VALUES ('"
                    + BAKERY_ID + "','Migration bakery','0900000000')");
            execute(connection, "INSERT INTO bakery_members(bakery_id,user_id,member_role) VALUES ('"
                    + BAKERY_ID + "','" + USER_ID + "','OWNER'), ('" + BAKERY_ID
                    + "',gen_random_uuid(),'MANAGER'), ('" + BAKERY_ID + "',gen_random_uuid(),'STAFF')");
            migrate("bakery-service", null);
            assertEquals(2, count(connection, "retired_bakery_members"));
            assertEquals(1, count(connection, "bakery_members"));
            assertEquals(1, count(connection, "bakery_members WHERE member_role='OWNER' AND user_id='" + USER_ID + "'"));
            assertThrows(SQLException.class, () -> execute(connection,
                    "INSERT INTO bakery_members(bakery_id,user_id,member_role) VALUES ('"
                            + BAKERY_ID + "',gen_random_uuid(),'MANAGER')"));
        }
    }

    @Test
    @DisplayName("Chat retires staff participation while retaining messages and sender attribution")
    void chatMigration_withStaffMessages_preservesHistoryAndRevokesParticipation() throws Exception {
        migrate("chat-service", "1");
        try (Connection connection = connection("chat-service")) {
            execute(connection, "INSERT INTO conversations(id,cake_request_id,customer_id,bakery_id) VALUES ('"
                    + BAKERY_ID + "',gen_random_uuid(),gen_random_uuid(),gen_random_uuid())");
            execute(connection, "INSERT INTO conversation_participants(id,conversation_id,user_id,participant_type) VALUES ('"
                    + USER_ID + "','" + BAKERY_ID + "',gen_random_uuid(),'BAKERY_STAFF')");
            execute(connection, "INSERT INTO messages(conversation_id,sender_participant_id,client_message_id,payload_fingerprint,content) VALUES ('"
                    + BAKERY_ID + "','" + USER_ID + "',gen_random_uuid(),'test','Historical message')");
            migrate("chat-service", null);
            assertEquals(1, count(connection, "messages WHERE sender_participant_id='" + USER_ID + "'"));
            assertEquals(1, count(connection, "conversation_participants WHERE left_at IS NOT NULL"));
            assertThrows(SQLException.class, () -> execute(connection,
                    "UPDATE conversation_participants SET left_at=NULL WHERE id='" + USER_ID + "'"));
        }
    }

    private void migrate(String service, String target) {
        Path location = Path.of("..", service, "src/main/resources/db/migration").toAbsolutePath().normalize();
        var config = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(service.replace('-', '_')).locations("filesystem:" + location);
        if (target != null) config.target(target);
        config.load().migrate();
    }

    private Connection connection(String service) throws SQLException {
        Connection connection = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        connection.setSchema(service.replace('-', '_'));
        return connection;
    }

    private void execute(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private int count(Connection connection, String from) throws SQLException {
        try (var statement = connection.createStatement();
             var rows = statement.executeQuery("SELECT COUNT(*) FROM " + from)) {
            rows.next();
            return rows.getInt(1);
        }
    }
}
