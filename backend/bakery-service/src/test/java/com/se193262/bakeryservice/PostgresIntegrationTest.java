package com.se193262.bakeryservice;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import com.se193262.bakeryservice.infrastructure.client.IdentityUserClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.junit.jupiter.api.BeforeEach;
import java.util.List;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "spring.config.import=")
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public abstract class PostgresIntegrationTest {
    @MockitoBean
    protected IdentityUserClient identityUserClient;

    @BeforeEach
    void identityFixture() {
        when(identityUserClient.requireOwner(any())).thenAnswer(call -> profile(call.getArgument(0)));
        when(identityUserClient.getUser(any())).thenAnswer(call -> profile(call.getArgument(0)));
    }

    private static IdentityUserClient.UserProfile profile(UUID id) {
        return new IdentityUserClient.UserProfile(id, "Test member", "ACTIVE", List.of("BAKERY_OWNER", "CUSTOMER"));
    }

    @Container
    static final PostgreSQLContainer database = new PostgreSQLContainer(
            DockerImageName.parse(System.getProperty("test.postgres.image", "postgres:17-alpine"))
                    .asCompatibleSubstituteFor("postgres"));

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", database::getJdbcUrl);
        properties.add("spring.datasource.username", database::getUsername);
        properties.add("spring.datasource.password", database::getPassword);
    }
}
