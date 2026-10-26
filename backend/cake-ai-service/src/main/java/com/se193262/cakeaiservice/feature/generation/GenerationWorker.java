package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.GenerationData.*;
import com.se193262.cakeaiservice.infrastructure.client.*;
import com.se193262.cakeaiservice.infrastructure.storage.*;
import com.se193262.cakeaiservice.infrastructure.storage.ImageValidator.Image;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;

@Component
public class GenerationWorker {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GenerationWorker.class);
    private final GenerationQueue queue;
    private final GenerationRepository repository;
    private final ImageProvider provider;
    private final ImageStorage storage;
    private final ImageValidator validator;
    private final GenerationInputs inputs;

    public GenerationWorker(GenerationQueue queue, GenerationRepository repository, ImageProvider provider,
            ImageStorage storage, ImageValidator validator, GenerationInputs inputs) {
        this.queue = queue; this.repository = repository; this.provider = provider;
        this.storage = storage; this.validator = validator; this.inputs = inputs;
    }

    public void run(Execution execution) {
        List<String> uploaded = new ArrayList<>();
        boolean committed = false;
        org.slf4j.MDC.put("correlationId", execution.id().toString());
        try {
            if (!queue.active(execution)) return;
            Job job = repository.job(execution.generationJobId(), false);
            inputs.validateContext(job.cakeRequestId(), job.customerId());
            Revision revision = repository.revisions(job.id()).stream()
                    .filter(item -> item.id().equals(execution.promptRevisionId())).findFirst().orElseThrow();
            var references = references(job.id(), revision.revisionNumber());
            String prompt = revision.prompt() + (revision.negativePrompt() == null ? "" : "\nAvoid: " + revision.negativePrompt());
            var inputDecision = provider.moderate(prompt, references);
            if (inputDecision != ImageProvider.Moderation.APPROVED) {
                queue.fail(execution, inputDecision == ImageProvider.Moderation.REJECTED
                        ? "INPUT_REJECTED" : "INPUT_MODERATION_UNAVAILABLE");
                return;
            }
            queue.approveSources(job.id());
            inputs.validateContext(job.cakeRequestId(), job.customerId());
            List<Design> designs = new ArrayList<>();
            for (int index = 0; index < execution.generationParameters().numberOfDesigns(); index++) {
                if (!queue.active(execution)) return;
                Image image = provider.generate(execution.modelName(), prompt, execution.generationParameters().aspectRatio(), references);
                image = validator.validate(image.bytes());
                var decision = provider.moderate("Assess this generated cake design.", List.of(image));
                if (!queue.active(execution)) return;
                designs.add(upload(execution, image, decision, uploaded));
            }
            committed = queue.complete(execution, designs);
            log.info("AI generation completed: jobId={}, executionId={}, published={}", job.id(), execution.id(), committed);
        } catch (RuntimeException error) {
            String code = error instanceof ProviderException providerError ? providerError.code() : "GENERATION_FAILED";
            log.warn("AI generation failed: jobId={}, executionId={}, code={}", execution.generationJobId(), execution.id(), code);
            queue.fail(execution, code);
        } finally {
            if (!committed) inputs.cleanup(uploaded);
            org.slf4j.MDC.remove("correlationId");
        }
    }

    private List<Image> references(UUID jobId, int revisionNumber) {
        List<Image> result = new ArrayList<>();
        for (Source source : repository.sources(jobId)) result.add(validator.validate(storage.read(source.objectKey())));
        if (revisionNumber > 1) {
            var revisions = repository.revisions(jobId);
            var previous = revisions.stream().filter(item -> item.revisionNumber() == revisionNumber - 1).findFirst();
            if (previous.isPresent()) repository.designs(jobId).stream()
                    .filter(design -> design.promptRevisionId().equals(previous.get().id()) && "APPROVED".equals(design.moderationStatus()))
                    .max(Comparator.comparing(Design::createdAt)).ifPresent(design ->
                            result.add(validator.validate(storage.read(design.imageObjectKey()))));
        }
        return result;
    }

    private Design upload(Execution execution, Image image, ImageProvider.Moderation decision, List<String> uploaded) {
        UUID id = UUID.randomUUID();
        String suffix = execution.generationJobId() + "/" + execution.id() + "/" + id;
        String key = "cake-ai/designs/" + suffix, thumbnail = "cake-ai/thumbnails/" + suffix;
        uploaded.add(key);
        storage.upload(key, image.bytes(), image.mediaType());
        uploaded.add(thumbnail);
        storage.upload(thumbnail, validator.thumbnail(image), "image/jpeg");
        return new Design(id, execution.generationJobId(), execution.promptRevisionId(), execution.id(), key,
                thumbnail, image.mediaType(), (long) image.bytes().length, image.width(), image.height(),
                decision.name(), decision == ImageProvider.Moderation.PENDING ? "AUTOMATED_REVIEW_UNAVAILABLE" : "AUTOMATED_REVIEW",
                Instant.now());
    }
}
