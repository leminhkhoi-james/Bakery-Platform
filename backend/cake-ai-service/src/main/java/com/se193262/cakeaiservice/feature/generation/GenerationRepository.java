package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.feature.generation.GenerationData.*;
import com.se193262.platform.exception.BusinessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;
import java.util.*;

@Repository
public class GenerationRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final GenerationJobRepository jobs;

    public GenerationRepository(JdbcClient jdbc, ObjectMapper json, GenerationJobRepository jobs) {
        this.jdbc = jdbc; this.json = json; this.jobs = jobs;
    }

    public Job job(UUID id, boolean lock) {
        if (lock) jdbc.sql("select id from generation_jobs where id=:id for update")
                .param("id", id).query(UUID.class).optional().orElseThrow(BusinessException::missing);
        var view = jobs.findProjectedById(id).orElseThrow(BusinessException::missing);
        return new Job(view.getId(), view.getCustomerId(), view.getCakeRequestId(), view.getStatus().name(),
                view.getModelName(), view.getGenerationParameters(), view.getErrorMessage(), view.getStartedAt(),
                view.getCompletedAt(), view.getCreatedAt(), view.getUpdatedAt());
    }

    public List<UUID> list(UUID customerId, UUID requestId, String status, int page, int size) {
        return jdbc.sql("select id from generation_jobs where customer_id=:customer "
                + "and (:request::uuid is null or cake_request_id=:request) "
                + "and (:status::varchar is null or status=:status) order by created_at desc,id desc limit :size offset :offset")
                .param("customer", customerId).param("request", requestId).param("status", status)
                .param("size", size).param("offset", (long) page * size).query(UUID.class).list();
    }

    public long count(UUID customerId, UUID requestId, String status) {
        return jdbc.sql("select count(*) from generation_jobs where customer_id=:customer "
                + "and (:request::uuid is null or cake_request_id=:request) "
                + "and (:status::varchar is null or status=:status)")
                .param("customer", customerId).param("request", requestId).param("status", status)
                .query(Long.class).single();
    }

    public void insertJob(Job job) {
        jdbc.sql("insert into generation_jobs(id,customer_id,cake_request_id,status,model_name,generation_parameters) "
                + "values(:id,:customer,:request,'QUEUED',:model,:parameters::jsonb)")
                .param("id", job.id()).param("customer", job.customerId()).param("request", job.cakeRequestId())
                .param("model", job.modelName()).param("parameters", json.writeValueAsString(job.generationParameters())).update();
    }

    public void insertRevision(Revision revision, Execution execution) {
        jdbc.sql("insert into prompt_revisions(id,generation_job_id,revision_number,prompt_text,negative_prompt,created_by) "
                + "values(:id,:job,:number,:prompt,:negative,:customer)")
                .param("id", revision.id()).param("job", revision.generationJobId()).param("number", revision.revisionNumber())
                .param("prompt", revision.prompt()).param("negative", revision.negativePrompt()).param("customer", revision.createdBy()).update();
        jdbc.sql("insert into generation_executions(id,generation_job_id,prompt_revision_id,model_name,generation_parameters) "
                + "values(:id,:job,:revision,:model,:parameters::jsonb)")
                .param("id", execution.id()).param("job", execution.generationJobId()).param("revision", revision.id())
                .param("model", execution.modelName()).param("parameters", json.writeValueAsString(execution.generationParameters())).update();
        jdbc.sql("update generation_jobs set status='QUEUED',model_name=:model,generation_parameters=:parameters::jsonb,"
                + "error_message=null,started_at=null,completed_at=null,updated_at=now(),version=version+1 where id=:id")
                .param("id", execution.generationJobId()).param("model", execution.modelName())
                .param("parameters", json.writeValueAsString(execution.generationParameters())).update();
    }

    public List<Revision> revisions(UUID jobId) {
        return jdbc.sql("select id,generation_job_id,revision_number,prompt_text as prompt,negative_prompt,created_by,created_at "
                + "from prompt_revisions where generation_job_id=:id order by revision_number")
                .param("id", jobId).query(Revision.class).list();
    }

    public List<Source> sources(UUID jobId) {
        return jdbc.sql("select id,generation_job_id,object_key,media_type,coalesce(size_bytes,0) size_bytes,display_order "
                + "from source_images where generation_job_id=:id order by display_order,id")
                .param("id", jobId).query(Source.class).list();
    }

    public void insertSource(Source source) {
        jdbc.sql("insert into source_images(id,generation_job_id,object_key,media_type,size_bytes,display_order) "
                + "values(:id,:job,:key,:type,:size,:display)").param("id", source.id())
                .param("job", source.generationJobId()).param("key", source.objectKey()).param("type", source.mediaType())
                .param("size", source.sizeBytes()).param("display", source.displayOrder()).update();
    }

    public List<Design> designs(UUID jobId) {
        return jdbc.sql("select * from generated_designs where generation_job_id=:id order by created_at,id")
                .param("id", jobId).query(Design.class).list();
    }

    public Design design(UUID id) {
        return jdbc.sql("select * from generated_designs where id=:id").param("id", id)
                .query(Design.class).optional().orElseThrow(BusinessException::missing);
    }

    public void insertDesign(Design design) {
        jdbc.sql("insert into generated_designs(id,generation_job_id,prompt_revision_id,execution_id,image_object_key,"
                + "thumbnail_object_key,media_type,size_bytes,width,height,moderation_status,moderation_reason,moderated_at,model_metadata) "
                + "values(:id,:job,:revision,:execution,:image,:thumbnail,:type,:size,:width,:height,:moderation,:reason,now(),"
                + "(select jsonb_build_object('model',model_name,'generationParameters',generation_parameters) from generation_executions where id=:execution))")
                .param("id", design.id()).param("job", design.generationJobId()).param("revision", design.promptRevisionId())
                .param("execution", design.executionId()).param("image", design.imageObjectKey())
                .param("thumbnail", design.thumbnailObjectKey()).param("type", design.mediaType()).param("size", design.sizeBytes())
                .param("width", design.width()).param("height", design.height()).param("moderation", design.moderationStatus())
                .param("reason", design.moderationReason()).update();
    }

    public void moderate(UUID id, String status, UUID admin) {
        int changed = jdbc.sql("update generated_designs set moderation_status=:status,moderation_reason='ADMIN_REVIEW',"
                + "moderated_by=:admin,moderated_at=now() where id=:id and moderation_status='PENDING'")
                .param("id", id).param("status", status).param("admin", admin).update();
        if (changed != 1) throw BusinessException.conflict();
    }

    public void lockIdempotency(UUID customerId, String operation, String key) {
        // Transaction-scoped lock serializes identical keys before uploads or inserts.
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended(:key,0))")
                .param("key", customerId + ":" + operation + ":" + key).query((row, index) -> 0).list();
    }

    public boolean sourcesApproved(UUID jobId) {
        return jdbc.sql("select not exists(select 1 from source_images where generation_job_id=:id and moderation_status<>'APPROVED')")
                .param("id", jobId).query(Boolean.class).single();
    }

    public Optional<String> replay(UUID customerId, String operation, String key, String hash) {
        var rows = jdbc.sql("select payload_hash,response_json::text from generation_idempotency "
                + "where customer_id=:customer and operation=:operation and idempotency_key=:key")
                .param("customer", customerId).param("operation", operation).param("key", key).query().listOfRows();
        if (rows.isEmpty()) return Optional.empty();
        if (!hash.equals(rows.getFirst().get("payload_hash"))) throw BusinessException.conflict();
        return Optional.of((String) rows.getFirst().get("response_json"));
    }

    public void saveIdempotency(UUID customer, String operation, String key, String hash, UUID job, String response) {
        jdbc.sql("insert into generation_idempotency(customer_id,operation,idempotency_key,payload_hash,generation_job_id,response_json) "
                + "values(:customer,:operation,:key,:hash,:job,:response::jsonb)")
                .param("customer", customer).param("operation", operation).param("key", key).param("hash", hash)
                .param("job", job).param("response", response).update();
    }

}
