package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.GenerationData.*;
import com.se193262.cakeaiservice.infrastructure.client.*;
import com.se193262.cakeaiservice.infrastructure.storage.*;
import com.se193262.cakeaiservice.infrastructure.storage.ImageValidator.Image;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;
import com.se193262.cakeaiservice.config.GenerationPolicy;
import com.se193262.cakeaiservice.config.CakeAiProperties;

@Component
public class GenerationWorker {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GenerationWorker.class);
    private final GenerationQueue queue;
    private final GenerationRepository repository;
    private final ImageProvider provider;
    private final ImageStorage storage;
    private final ImageValidator validator;
    private final GenerationInputs inputs;
    private final ProviderCallTracker calls;
    private final GenerationPolicy policy;
    private final CakeAiProperties properties;

    public GenerationWorker(GenerationQueue queue, GenerationRepository repository, ImageProvider provider,
            ImageStorage storage, ImageValidator validator, GenerationInputs inputs, ProviderCallTracker calls,
            GenerationPolicy policy, CakeAiProperties properties) {
        this.queue = queue; this.repository = repository; this.provider = provider;
        this.storage = storage; this.validator = validator; this.inputs = inputs; this.calls = calls; this.policy = policy; this.properties = properties;
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
            var inputDecision = calls.invoke(execution, "INPUT_MODERATION", properties.moderationModel(),
                    () -> provider.moderate(prompt, references));
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
                inputs.validateContext(job.cakeRequestId(), job.customerId());
                Image generated = calls.invoke(execution, "IMAGE", execution.modelName(), () -> provider.generate(
                        execution.modelName(), prompt, execution.generationParameters().aspectRatio(), references));
                Image validated = validator.validate(generated.bytes());
                Image image = new Image(validated.bytes(), validated.mediaType(), validated.width(), validated.height(), generated.provenance());
                inputs.validateContext(job.cakeRequestId(), job.customerId());
                var decision = calls.invoke(execution, "OUTPUT_MODERATION", properties.moderationModel(),
                        () -> provider.moderate("Assess this generated cake design.", List.of(image)));
                if (!queue.active(execution)) return;
                designs.add(upload(execution, image, decision, uploaded));
            }
            committed = queue.complete(execution, designs);
            log.info("AI generation completed: jobId={}, executionId={}, published={}", job.id(), execution.id(), committed);
        } catch (RuntimeException error) {
            String code = error instanceof ProviderException providerError ? providerError.code()
                    : error instanceof StorageFailureException ? "STORAGE_UNAVAILABLE"
                    : error instanceof com.se193262.platform.exception.BusinessException business && business.status() == 429
                            ? "PROVIDER_BUDGET_EXHAUSTED" : "GENERATION_FAILED";
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
        var metadata = new HashMap<String, Object>(image.provenance());
        metadata.put("automatedModerationStatus", decision.name());
        metadata.put("reviewPolicy", policy.requireAdminReview() ? "ADMIN_REQUIRED" : "AUTOMATED");
        metadata.put("storage", storage instanceof FirebaseStorageAdapter ? "GCS_READBACK_VERIFIED" : "UNVERIFIED_TEST_STORAGE");
        try { metadata.put("sha256", HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(image.bytes()))); }
        catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
        boolean manualReview = policy.requireAdminReview() && decision == ImageProvider.Moderation.APPROVED;
        String status = manualReview ? "PENDING" : decision.name();
        String reason = manualReview ? "ADMIN_REVIEW_REQUIRED"
                : decision == ImageProvider.Moderation.PENDING ? "AUTOMATED_REVIEW_UNAVAILABLE" : "AUTOMATED_REVIEW";
        return new Design(id, execution.generationJobId(), execution.promptRevisionId(), execution.id(), key,
                thumbnail, image.mediaType(), (long) image.bytes().length, image.width(), image.height(),
                status, reason, Instant.now(), Map.copyOf(metadata), null, null);
    }
}
