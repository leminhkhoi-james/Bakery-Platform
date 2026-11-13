package com.se193262.marketplaceservice;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.*;

import java.nio.file.*;

class MigrationSyncTest {
    @Test
    @DisplayName("Marketplace runtime migrations match canonical SQL")
    void migrations_runtime_matchesCanonical() throws Exception {
        try (var files = Files.list(Path.of("../../database/postgresql/marketplace-service"))) {
            for (var file : files.filter(f -> f.getFileName().toString().startsWith("V")).toList())
                assertArrayEquals(
                        Files.readAllBytes(file),
                        Files.readAllBytes(
                                Path.of("src/main/resources/db/migration")
                                        .resolve(file.getFileName())));
        }
    }
}
