package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

/** Flyway owns DDL; queue writes use conditional SQL and increment the same optimistic version. */
@Entity
@Table(name = "generation_jobs")
public class GenerationJob {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(name = "cake_request_id", nullable = false) private UUID cakeRequestId;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30) private GenerationStatus status;
    @Column(name = "model_name", nullable = false, length = 120) private String modelName;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generation_parameters", nullable = false, columnDefinition = "jsonb")
    private GenerationParameters generationParameters;
    @Column(name = "error_message", columnDefinition = "text") private String errorMessage;
    @Column(name = "started_at") private Instant startedAt;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Version @Column(name = "version", nullable = false) private long version;
    protected GenerationJob() {}
}
