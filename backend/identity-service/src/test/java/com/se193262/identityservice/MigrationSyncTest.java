package com.se193262.identityservice;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MigrationSyncTest {

    @Test
    @DisplayName("Flyway runtime migrations luôn đồng bộ với canonical Identity DDL")
    void runtimeMigrations_matchCanonicalDatabaseFiles() throws Exception {
        Path projectRoot = Path.of("..", "..").toAbsolutePath().normalize();
        assertMigrationMatches(projectRoot, "V1__init_schema.sql");
        assertMigrationMatches(projectRoot, "V2__seed_reference_data.sql");
    }

    private void assertMigrationMatches(Path projectRoot, String fileName) throws Exception {
        Path canonical = projectRoot.resolve("database/postgresql/identity-service").resolve(fileName);
        Path runtime = Path.of("src/main/resources/db/migration").resolve(fileName);
        String canonicalSql = Files.readString(canonical).replace("\r\n", "\n").trim();
        String runtimeSql = Files.readString(runtime).replace("\r\n", "\n").trim();
        assertEquals(canonicalSql, runtimeSql, fileName + " is out of sync");
    }
}
