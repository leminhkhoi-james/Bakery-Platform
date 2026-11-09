package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.feature.design.dto.GeneratedDesignResponse;
import com.se193262.cakeaiservice.feature.generation.GenerationData.Design;
import com.se193262.cakeaiservice.feature.generation.GenerationRepository;
import com.se193262.cakeaiservice.feature.generation.GenerationRepository.DesignContext;
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
        this.repository = repository; this.storage = storage;
        this.transaction = new TransactionTemplate(manager); this.clock = clock;
    }

    public GeneratedDesignResponse get(UUID id) {
        var context = repository.designContext(id);
        authorize(context);
        return response(context, true);
    }

    public GeneratedDesignResponse moderate(UUID id, String status, String reason) {
        Actor actor = Actor.current();
        if (!actor.admin()) throw BusinessException.forbidden();
        if (!Set.of("APPROVED", "REJECTED").contains(status)) throw BusinessException.invalid("Invalid moderation status");
        String explanation = reason == null || reason.isBlank() ? "ADMIN_REVIEW" : reason.strip();
        if (explanation.length() > 1000) throw BusinessException.invalid("Moderation reason exceeds limit");
        transaction.executeWithoutResult(ignored -> {
            repository.design(id);
            repository.moderate(id, status, actor.id(), explanation);
        });
        return get(id);
    }

    public DesignPage pending(String status, int page, int size) {
        if (!Actor.current().admin()) throw BusinessException.forbidden();
        if (page < 0 || size < 1 || size > 100 || status != null && !Set.of("PENDING", "APPROVED", "REJECTED").contains(status))
            throw BusinessException.invalid("Invalid moderation filter or pagination");
        long count = repository.moderationCount(status);
        return new DesignPage(repository.moderationPage(status, page, size).stream()
                .map(context -> response(context, false)).toList(), page, size, count, (int) ((count + size - 1) / size));
    }

    public GeneratedDesignResponse response(Design design) {
        var context = repository.designContext(design.id());
        authorize(context);
        return response(context, false);
    }

    private void authorize(DesignContext context) {
        var actor = Actor.current();
        if (!actor.admin() && !context.customerId().equals(actor.id())) throw BusinessException.forbidden();
    }

    private GeneratedDesignResponse response(DesignContext context, boolean history) {
        Design design = context.design();
        boolean permitted = "APPROVED".equals(design.moderationStatus())
                || Actor.current().admin() && "PENDING".equals(design.moderationStatus());
        return new GeneratedDesignResponse(design.id(), design.generationJobId(), design.promptRevisionId(),
                design.moderationStatus(), design.moderationReason(),
                permitted ? storage.signedUrl(design.imageObjectKey()) : null,
                permitted && design.thumbnailObjectKey() != null ? storage.signedUrl(design.thumbnailObjectKey()) : null,
                permitted ? clock.instant().plusSeconds(900) : null, design.mediaType(), design.sizeBytes(),
                design.width(), design.height(), design.createdAt(), context.customerId(), context.cakeRequestId(),
                design.moderatedBy(), design.moderatedAt(), design.providerMetadata(),
                history ? repository.moderationHistory(design.id()) : List.of());
    }
}
