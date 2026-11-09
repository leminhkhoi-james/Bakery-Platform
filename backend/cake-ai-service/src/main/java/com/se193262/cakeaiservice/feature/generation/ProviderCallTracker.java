package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.config.GenerationPolicy;
import com.se193262.cakeaiservice.feature.generation.GenerationData.Execution;
import com.se193262.cakeaiservice.infrastructure.client.ProviderException;
import com.se193262.cakeaiservice.infrastructure.storage.ImageValidator.Image;
import com.se193262.platform.exception.BusinessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.function.Supplier;

/** Durable count-before-call ledger. Unknown/failed calls consume budget and are never retried. */
@Component
public class ProviderCallTracker {
    private final JdbcClient jdbc;
    private final GenerationPolicy policy;
    private final TransactionTemplate transaction;
    private final ObjectMapper json;
    public ProviderCallTracker(JdbcClient jdbc, GenerationPolicy policy, PlatformTransactionManager manager, ObjectMapper json) {
        this.jdbc = jdbc; this.policy = policy; this.transaction = new TransactionTemplate(manager); this.json = json;
    }

    public <T> T invoke(Execution execution, String kind, String model, Supplier<T> work) {
        UUID call = transaction.execute(ignored -> start(execution, kind, model));
        try {
            T result = work.get();
            Map<String, Object> evidence = result instanceof Image image ? image.provenance() : Map.of("decision", result.toString());
            finish(call, "RETURNED", evidence);
            return result;
        } catch (RuntimeException error) {
            String code = error instanceof ProviderException provider ? provider.code() : "CLIENT_FAILED";
            finish(call, "PROVIDER_RESULT_UNKNOWN".equals(code) ? "UNKNOWN" : "FAILED", Map.of("code", code));
            throw error;
        }
    }

    private UUID start(Execution execution, String kind, String model) {
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended('cake-ai:provider-budget',0))")
                .query((row, index) -> 0).list();
        var reservations = jdbc.sql("select reserved_provider_calls from generation_executions "
                + "where id=:id and claim_token=:token and status='PROCESSING' and lease_until>now() for update")
                .param("id", execution.id()).param("token", execution.claimToken()).query(Integer.class).optional();
        if (reservations.isEmpty()) throw BusinessException.conflict();
        long used = jdbc.sql("select count(*) from generation_provider_calls where execution_id=:id")
                .param("id", execution.id()).query(Long.class).single();
        long daily = jdbc.sql("select count(*) from generation_provider_calls where created_at >= "
                + "date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'").query(Long.class).single();
        if (used >= reservations.get() || daily >= policy.dailyProviderRequests())
            throw new BusinessException(429, "Cake AI provider budget exhausted");
        UUID id = UUID.randomUUID();
        jdbc.sql("insert into generation_provider_calls(id,execution_id,kind,model_name,status) values(:id,:execution,:kind,:model,'STARTED')")
                .param("id", id).param("execution", execution.id()).param("kind", kind).param("model", model).update();
        return id;
    }

    private void finish(UUID id, String status, Map<String, Object> evidence) {
        jdbc.sql("update generation_provider_calls set status=:status,result=:result::jsonb,completed_at=now() where id=:id")
                .param("id", id).param("status", status).param("result", json.writeValueAsString(evidence)).update();
    }
}
