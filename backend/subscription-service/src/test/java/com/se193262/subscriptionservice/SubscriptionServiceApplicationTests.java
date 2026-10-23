package com.se193262.subscriptionservice;

import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.*;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class SubscriptionServiceApplicationTests {
    @Container
    static final PostgreSQLContainer database =
            new PostgreSQLContainer(
                    org.testcontainers.utility.DockerImageName.parse(
                                    System.getProperty("test.postgres.image", "postgres:17-alpine"))
                            .asCompatibleSubstituteFor("postgres"));

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", database::getJdbcUrl);
        properties.add("spring.datasource.username", database::getUsername);
        properties.add("spring.datasource.password", database::getPassword);
    }

    @Test
    @DisplayName("Service starts with migrated PostgreSQL schema")
    void contextLoads() {}
}
