package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.GenerationData.*;
import com.se193262.cakeaiservice.feature.generation.dto.*;
import com.se193262.cakeaiservice.feature.design.DesignService;
import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.cakeaiservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;

@Component
public class GenerationReader {
    public record SourceResponse(UUID id, String url, Instant expiresAt, String mediaType, long sizeBytes, int displayOrder) {}
    public record JobDetail(Job job, int currentRevision, List<Revision> promptRevisions,
            List<SourceResponse> sourceImages, List<GeneratedDesignResponse> generatedDesigns) {}
    public record JobPage(List<GenerationJobResponse> content, int page, int size, long totalElements, int totalPages) {}
    private final GenerationRepository repository;
    private final ImageStorage storage;
    private final DesignService designs;
    private final Clock clock;

    public GenerationReader(GenerationRepository repository, ImageStorage storage, DesignService designs, Clock clock) {
        this.repository = repository; this.storage = storage; this.designs = designs; this.clock = clock;
    }

    public Job owner(UUID id, boolean adminAllowed) {
        Job job = repository.job(id, false);
        Actor actor = Actor.current();
        if (!job.customerId().equals(actor.id()) && !(adminAllowed && actor.admin())) throw BusinessException.forbidden();
        return job;
    }

    public GenerationJobResponse summary(UUID id) {
        Job job = repository.job(id, false);
        return new GenerationJobResponse(id, job.status(), job.modelName(), repository.revisions(id).size(),
                job.createdAt(), job.updatedAt());
    }

    public JobDetail detail(UUID id) {
        Job job = owner(id, true);
        var revisions = repository.revisions(id);
        return new JobDetail(job, revisions.size(), revisions,
                repository.sourcesApproved(id) ? repository.sources(id).stream().map(source -> new SourceResponse(
                        source.id(), storage.signedUrl(source.objectKey()), clock.instant().plusSeconds(900),
                        source.mediaType(), source.sizeBytes(), source.displayOrder())).toList() : List.of(),
                repository.designs(id).stream().map(designs::response).toList());
    }

    public JobPage list(UUID requestId, String status, int page, int size) {
        if (page < 0 || size < 1 || size > 100 || status != null
                && !Set.of("QUEUED", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED").contains(status))
            throw BusinessException.invalid("Invalid pagination or job status");
        UUID customerId = Actor.current().id();
        long count = repository.count(customerId, requestId, status);
        return new JobPage(repository.list(customerId, requestId, status, page, size).stream().map(this::summary).toList(),
                page, size, count, (int) ((count + size - 1) / size));
    }
}
