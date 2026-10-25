package com.se193262.cakeaiservice.infrastructure.scheduler;

import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.cakeaiservice.feature.generation.*;
import com.se193262.cakeaiservice.infrastructure.storage.ImageStorage;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.concurrent.*;

@Component
@ConditionalOnProperty(name = "cake-ai.scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class GenerationScheduler {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GenerationScheduler.class);
    private final GenerationQueue queue;
    private final GenerationWorker worker;
    private final ImageStorage storage;
    private final Clock clock;
    private final ExecutorService executor;
    private final Semaphore slots;

    public GenerationScheduler(GenerationQueue queue, GenerationWorker worker, ImageStorage storage,
            CakeAiProperties properties, Clock clock) {
        this.queue = queue; this.worker = worker; this.storage = storage; this.clock = clock;
        int count = Math.max(1, Math.min(16, properties.workers()));
        executor = Executors.newFixedThreadPool(count);
        slots = new Semaphore(count);
    }

    @Scheduled(fixedDelayString = "${cake-ai.poll-delay-ms:1000}")
    public void poll() {
        queue.recoverExpired();
        while (slots.tryAcquire()) {
            try {
                var execution = queue.claim();
                if (execution.isEmpty()) { slots.release(); return; }
                executor.submit(() -> {
                    try { worker.run(execution.get()); }
                    finally { slots.release(); }
                });
            } catch (RuntimeException error) { slots.release(); throw error; }
        }
    }

    @Scheduled(fixedDelayString = "${cake-ai.cleanup-delay-ms:3600000}", initialDelayString = "${cake-ai.cleanup-delay-ms:3600000}")
    public void cleanup() {
        try {
            Instant cutoff = clock.instant().minus(Duration.ofHours(24));
            for (var object : storage.scan(100)) {
                if (object.createdAt().isBefore(cutoff) && !queue.isReferencedOrActive(object.key())) storage.delete(object.key());
            }
        } catch (RuntimeException error) { log.warn("AI orphan cleanup deferred"); }
    }

    @PreDestroy
    public void stop() { executor.shutdown(); }
}
