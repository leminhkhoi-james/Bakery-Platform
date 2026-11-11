package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import org.springframework.data.repository.Repository;
import java.time.Instant;
import java.util.*;

public interface GenerationJobRepository extends Repository<GenerationJob, UUID> {
    boolean existsById(UUID id);
    Optional<GenerationJob> findById(UUID id);
    <S extends GenerationJob> S save(S job);
    interface JobView {
        UUID getId();
        UUID getCustomerId();
        UUID getCakeRequestId();
        GenerationStatus getStatus();
        String getModelName();
        GenerationParameters getGenerationParameters();
        String getErrorMessage();
        Instant getStartedAt();
        Instant getCompletedAt();
        Instant getCreatedAt();
        Instant getUpdatedAt();
    }
    Optional<JobView> findProjectedById(UUID id);
}
