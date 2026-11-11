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
    public GenerationJob() {}
    public String getModelName() { return modelName; }
    public String getErrorMessage() { return errorMessage; }

    public void setId(UUID value) { this.id = value; }
    public void setCustomerId(UUID value) { this.customerId = value; }
    public void setCakeRequestId(UUID value) { this.cakeRequestId = value; }
    public void setStatus(GenerationStatus value) { this.status = value; }
    public void setModelName(String value) { this.modelName = value; }
    public void setGenerationParameters(GenerationParameters value) { this.generationParameters = value; }
    public void setErrorMessage(String value) { this.errorMessage = value; }
    public void setStartedAt(Instant value) { this.startedAt = value; }
    public void setCompletedAt(Instant value) { this.completedAt = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
}
