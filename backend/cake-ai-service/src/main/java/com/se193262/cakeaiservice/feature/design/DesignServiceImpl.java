package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.cakeaiservice.feature.generation.GenerationData.Design;
import com.se193262.cakeaiservice.feature.generation.GenerationRepository;
import com.se193262.cakeaiservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.*;
import java.util.*;

@Service
public class DesignServiceImpl implements DesignService {
    private final GenerationRepository repository;
    private final ImageStorage storage;
    private final TransactionTemplate transaction;
    private final Clock clock;

    public DesignServiceImpl(GenerationRepository repository, ImageStorage storage,
            PlatformTransactionManager manager, Clock clock) {
        this.repository = repository;
        this.storage = storage;
        this.transaction = new TransactionTemplate(manager);
        this.clock = clock;
    }

    public GeneratedDesignResponse get(UUID id) {
        Design design = repository.design(id);
        var actor = Actor.current();
        if (!actor.admin() && !repository.job(design.generationJobId(), false).customerId().equals(actor.id()))
            throw BusinessException.forbidden();
        return response(design);
    }

    public GeneratedDesignResponse moderate(UUID id, String status) {
        Actor actor = Actor.current();
        if (!actor.admin()) throw BusinessException.forbidden();
        if (!Set.of("APPROVED", "REJECTED").contains(status)) throw BusinessException.invalid("Invalid moderation status");
        transaction.executeWithoutResult(ignored -> {
            repository.design(id);
            repository.moderate(id, status, actor.id());
        });
        return get(id);
    }

    public GeneratedDesignResponse response(Design design) {
        boolean approved = "APPROVED".equals(design.moderationStatus());
        return new GeneratedDesignResponse(design.id(), design.generationJobId(), design.promptRevisionId(),
                design.moderationStatus(), design.moderationReason(),
                approved ? storage.signedUrl(design.imageObjectKey()) : null,
                approved && design.thumbnailObjectKey() != null ? storage.signedUrl(design.thumbnailObjectKey()) : null,
                approved ? clock.instant().plusSeconds(900) : null, design.mediaType(), design.sizeBytes(),
                design.width(), design.height(), design.createdAt());
    }
}
