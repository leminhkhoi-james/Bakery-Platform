package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.GenerationData.*;
import com.se193262.cakeaiservice.feature.generation.dto.*;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;
import java.security.MessageDigest;
import java.util.*;

@Service
public class GenerationServiceImpl implements GenerationService {
    private final GenerationRepository repository;
    private final GenerationReader reader;
    private final GenerationInputs inputs;
    private final GenerationQueue queue;
    private final TransactionTemplate transaction;
    private final ObjectMapper json;

    public GenerationServiceImpl(GenerationRepository repository, GenerationReader reader,
            GenerationInputs inputs, GenerationQueue queue, PlatformTransactionManager manager, ObjectMapper json) {
        this.repository = repository; this.reader = reader; this.inputs = inputs; this.queue = queue;
        this.transaction = new TransactionTemplate(manager); this.json = json;
    }

    public GenerationJobResponse create(CreateGenerationJobRequest request, List<MultipartFile> files, String key) {
        validateKey(key);
        UUID customerId = Actor.current().id();
        var parameters = parameters(request.generationParameters());
        var images = inputs.validateFiles(files);
        String hash = fingerprint(List.of(request.cakeRequestId(), request.prompt(),
                Objects.toString(request.negativePrompt(), ""), parameters,
                images.stream().map(image -> digest(image.bytes())).toList()));
        var replay = replay(customerId, "CREATE", key, hash);
        if (replay.isPresent()) return replay.get();
        inputs.validateContext(request.cakeRequestId(), customerId);
        UUID jobId = UUID.randomUUID();
        List<Source> sources = inputs.upload(jobId, images);
        boolean[] inserted = {false};
        try {
            return transaction.execute(ignored -> {
                repository.lockIdempotency(customerId, "CREATE", key);
                var existing = replay(customerId, "CREATE", key, hash);
                if (existing.isPresent()) return existing.get();
                repository.insertJob(new Job(jobId, customerId, request.cakeRequestId(), "QUEUED",
                        inputs.model(), parameters, null, null, null, null, null));
                sources.forEach(repository::insertSource);
                insertRevision(jobId, customerId, 1, request.prompt(), request.negativePrompt(), parameters);
                var response = reader.summary(jobId);
                repository.saveIdempotency(customerId, "CREATE", key, hash, jobId, json.writeValueAsString(response));
                inserted[0] = true;
                return response;
            });
        } catch (RuntimeException error) {
            inserted[0] = false;
            throw error;
        } finally {
            if (!inserted[0]) inputs.cleanup(sources.stream().map(Source::objectKey).toList());
        }
    }

    public GenerationJobResponse revise(UUID jobId, CreatePromptRevisionRequest request, String key) {
        validateKey(key);
        UUID customerId = Actor.current().id();
        var parameters = parameters(request.generationParameters());
        String operation = "REVISE:" + jobId;
        String hash = fingerprint(Arrays.asList(request.prompt(), request.negativePrompt(), parameters));
        var replay = replay(customerId, operation, key, hash);
        if (replay.isPresent()) return replay.get();
        Job job = reader.owner(jobId, false);
        inputs.validateContext(job.cakeRequestId(), customerId);
        return transaction.execute(ignored -> {
            repository.lockIdempotency(customerId, operation, key);
            var existing = replay(customerId, operation, key, hash);
            if (existing.isPresent()) return existing.get();
            Job locked = repository.job(jobId, true);
            if (!Set.of("SUCCEEDED", "FAILED").contains(locked.status())) throw BusinessException.conflict();
            insertRevision(jobId, customerId, repository.revisions(jobId).size() + 1,
                    request.prompt(), request.negativePrompt(), parameters);
            var response = reader.summary(jobId);
            repository.saveIdempotency(customerId, operation, key, hash, jobId, json.writeValueAsString(response));
            return response;
        });
    }

    public GenerationJobResponse cancel(UUID jobId) {
        reader.owner(jobId, false);
        transaction.executeWithoutResult(ignored -> {
            Job job = repository.job(jobId, true);
            if (!Set.of("QUEUED", "PROCESSING").contains(job.status())) throw BusinessException.conflict();
            queue.cancel(jobId);
        });
        return reader.summary(jobId);
    }

    public GenerationReader.JobDetail detail(UUID jobId) { return reader.detail(jobId); }
    public GenerationReader.JobPage list(UUID requestId, String status, int page, int size) {
        return reader.list(requestId, status, page, size);
    }

    private void insertRevision(UUID jobId, UUID customerId, int number, String prompt,
            String negative, GenerationParameters parameters) {
        UUID revisionId = UUID.randomUUID();
        repository.insertRevision(new Revision(revisionId, jobId, number, prompt, negative, customerId, null),
                new Execution(UUID.randomUUID(), jobId, revisionId, "QUEUED", inputs.model(), parameters, null));
    }

    private Optional<GenerationJobResponse> replay(UUID customerId, String operation, String key, String hash) {
        return repository.replay(customerId, operation, key, hash)
                .map(value -> json.readValue(value, GenerationJobResponse.class));
    }

    private GenerationParameters parameters(GenerationParameters value) {
        return (value == null ? new GenerationParameters(null, null) : value).normalized();
    }

    private void validateKey(String key) {
        if (key == null || key.isBlank() || key.length() > 128)
            throw BusinessException.invalid("Idempotency-Key must contain 1–128 characters");
    }

    private String fingerprint(Object value) { return digest(json.writeValueAsBytes(value)); }

    private static String digest(byte[] value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value)); }
        catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
}
