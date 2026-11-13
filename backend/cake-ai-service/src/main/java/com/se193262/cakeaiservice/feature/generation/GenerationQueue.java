package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.cakeaiservice.feature.generation.GenerationData.*;
import com.se193262.cakeaiservice.feature.generation.dto.GenerationParameters;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.ObjectMapper;
import java.util.*;

@Component
public class GenerationQueue {
    private final JdbcClient jdbc;
    private final GenerationRepository repository;
    private final TransactionTemplate transaction;
    private final CakeAiProperties properties;
    private final ObjectMapper json;

    public GenerationQueue(JdbcClient jdbc, GenerationRepository repository, PlatformTransactionManager manager,
            CakeAiProperties properties, ObjectMapper json) {
        this.jdbc = jdbc; this.repository = repository; this.transaction = new TransactionTemplate(manager);
        this.properties = properties; this.json = json;
    }

    public Optional<Execution> claim() {
        return transaction.execute(ignored -> {
            var ids = jdbc.sql("select j.id from generation_jobs j where j.status='QUEUED' "
                    + "and exists(select 1 from generation_executions e where e.generation_job_id=j.id and e.status='QUEUED') "
                    + "order by j.created_at for update skip locked limit 1").query(UUID.class).list();
            if (ids.isEmpty()) return Optional.empty();
            UUID jobId = ids.getFirst(), token = UUID.randomUUID();
            Execution execution = jdbc.sql("update generation_executions set status='PROCESSING',claim_token=:token,"
                    + "lease_until=now()+(:seconds * interval '1 second') where generation_job_id=:job and status='QUEUED' returning *")
                    .param("job", jobId).param("token", token).param("seconds", properties.leaseDuration().toSeconds())
                    .query((row, index) -> new Execution(row.getObject("id", UUID.class), jobId,
                            row.getObject("prompt_revision_id", UUID.class), "PROCESSING", row.getString("model_name"),
                            json.readValue(row.getString("generation_parameters"), GenerationParameters.class), token)).single();
            jdbc.sql("update generation_jobs set status='PROCESSING',started_at=now(),updated_at=now(),version=version+1 where id=:id")
                    .param("id", jobId).update();
            return Optional.of(execution);
        });
    }

    public boolean active(Execution execution) {
        return jdbc.sql("select exists(select 1 from generation_executions e join generation_jobs j on j.id=e.generation_job_id "
                + "where e.id=:id and e.claim_token=:token and e.status='PROCESSING' and e.lease_until>now() and j.status='PROCESSING')")
                .param("id", execution.id()).param("token", execution.claimToken()).query(Boolean.class).single();
    }

    public boolean complete(Execution execution, List<Design> designs) {
        return transaction.execute(ignored -> {
            repository.job(execution.generationJobId(), true);
            if (!active(execution)) return false;
            designs.forEach(repository::insertDesign);
            finish(execution, "SUCCEEDED", null);
            return true;
        });
    }

    public void fail(Execution execution, String code) {
        transaction.executeWithoutResult(ignored -> {
            repository.job(execution.generationJobId(), true);
            if (active(execution)) finish(execution, "FAILED", code);
        });
    }

    public void approveSources(UUID jobId) {
        jdbc.sql("update source_images set moderation_status='APPROVED' where generation_job_id=:job")
                .param("job", jobId).update();
    }

    public void cancel(UUID jobId) {
        jdbc.sql("update generation_executions set status='CANCELLED',completed_at=now(),lease_until=null "
                + "where generation_job_id=:id and status in ('QUEUED','PROCESSING')").param("id", jobId).update();
        jdbc.sql("update generation_jobs set status='CANCELLED',completed_at=now(),updated_at=now(),version=version+1 where id=:id")
                .param("id", jobId).update();
    }

    public void recoverExpired() {
        transaction.executeWithoutResult(ignored -> {
            var ids = jdbc.sql("select j.id from generation_jobs j where j.status='PROCESSING' and exists "
                    + "(select 1 from generation_executions e where e.generation_job_id=j.id and e.status='PROCESSING' "
                    + "and e.lease_until<=now()) for update skip locked limit 100").query(UUID.class).list();
            for (UUID id : ids) {
                jdbc.sql("update generation_executions set status='FAILED',error_code='EXECUTION_LEASE_EXPIRED',"
                        + "completed_at=now(),lease_until=null where generation_job_id=:id and status='PROCESSING'")
                        .param("id", id).update();
                jdbc.sql("update generation_jobs set status='FAILED',error_message='EXECUTION_LEASE_EXPIRED',"
                        + "completed_at=now(),updated_at=now(),version=version+1 where id=:id").param("id", id).update();
            }
        });
    }

    public boolean isReferencedOrActive(String key) {
        if (java.util.stream.Stream.of("cake-ai/sources/", "cake-ai/designs/", "cake-ai/thumbnails/")
                .noneMatch(key::startsWith)) return true;
        String[] parts = key.split("/");
        if (parts.length < 4) return true;
        UUID jobId;
        try { jobId = UUID.fromString(parts[2]); }
        catch (IllegalArgumentException error) { return true; }
        return jdbc.sql("select exists(select 1 from source_images where object_key=:key) "
                + "or exists(select 1 from generated_designs where image_object_key=:key or thumbnail_object_key=:key) "
                + "or exists(select 1 from generation_executions where generation_job_id=:job and status in ('QUEUED','PROCESSING'))")
                .param("key", key).param("job", jobId).query(Boolean.class).single();
    }

    private void finish(Execution execution, String status, String code) {
        jdbc.sql("update generation_executions set status=:status,error_code=:code,completed_at=now(),lease_until=null where id=:id")
                .param("status", status).param("code", code).param("id", execution.id()).update();
        jdbc.sql("update generation_jobs set status=:status,error_message=:code,completed_at=now(),updated_at=now(),version=version+1 where id=:id")
                .param("status", status).param("code", code).param("id", execution.generationJobId()).update();
    }
}
