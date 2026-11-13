package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import com.se193262.platform.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "generation_executions")
public class GenerationExecution extends UuidEntity {
    @Column(name = "generation_job_id", nullable = false) private UUID generationJobId;
    @Column(name = "prompt_revision_id", nullable = false) private UUID promptRevisionId;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 30) private GenerationStatus status;
    @Column(name = "model_name", nullable = false, length = 120) private String modelName;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "generation_parameters", nullable = false, columnDefinition = "jsonb") private GenerationParameters generationParameters;
    @Column(name = "error_code", length = 80) private String errorCode;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "reserved_provider_calls", nullable = false) private int reservedProviderCalls;
    public GenerationExecution() { }
    public String getModelName() { return modelName; }
    public String getErrorCode() { return errorCode; }

    public void setGenerationJobId(UUID value) { this.generationJobId = value; }
    public void setPromptRevisionId(UUID value) { this.promptRevisionId = value; }
    public void setStatus(GenerationStatus value) { this.status = value; }
    public void setModelName(String value) { this.modelName = value; }
    public void setGenerationParameters(GenerationParameters value) { this.generationParameters = value; }
    public void setErrorCode(String value) { this.errorCode = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public void setCompletedAt(Instant value) { this.completedAt = value; }
    public void setReservedProviderCalls(int value) { this.reservedProviderCalls = value; }
}
