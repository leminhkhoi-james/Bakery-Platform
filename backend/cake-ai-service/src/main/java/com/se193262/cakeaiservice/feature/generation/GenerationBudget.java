package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.config.GenerationPolicy;
import com.se193262.platform.exception.BusinessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import java.util.UUID;

/** Called inside the admission transaction, after idempotency replay and positive RFQ validation. */
@Component
public class GenerationBudget {
    private final JdbcClient jdbc;
    private final GenerationPolicy policy;
    public GenerationBudget(JdbcClient jdbc, GenerationPolicy policy) { this.jdbc = jdbc; this.policy = policy; }

    public void reserve(UUID customer, int requestedCalls) {
        if (!policy.enabled()) throw BusinessException.unavailable();
        if ((requestedCalls - 1) / 2 > policy.maxDesignsPerExecution())
            throw BusinessException.invalid("Requested design count exceeds this deployment's limit");
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended('cake-ai:admission-budget',0))")
                .query((row, index) -> 0).list();
        long active = jdbc.sql("select count(*) from generation_executions e join generation_jobs j "
                + "on j.id=e.generation_job_id where j.customer_id=:customer and e.status in ('QUEUED','PROCESSING')")
                .param("customer", customer).query(Long.class).single();
        long daily = jdbc.sql("select count(*) from generation_executions e join generation_jobs j "
                + "on j.id=e.generation_job_id where j.customer_id=:customer and e.created_at >= "
                + "date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'")
                .param("customer", customer).query(Long.class).single();
        long reserved = jdbc.sql("select coalesce(sum(reserved_provider_calls),0) from generation_executions "
                + "where created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'")
                .query(Long.class).single();
        if (active >= policy.activeExecutionsPerCustomer() || daily >= policy.dailyExecutionsPerCustomer()
                || reserved + requestedCalls > policy.dailyProviderRequests())
            throw new BusinessException(429, "Cake AI generation limit reached; retry after the quota window");
    }
}
