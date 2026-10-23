package com.se193262.cakeaiservice.feature.design;

import com.se193262.platform.exception.BusinessException;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class DesignValidationService {
    private final JdbcClient jdbc;

    public DesignValidationService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> validate(UUID designId, UUID customerId, UUID cakeRequestId) {
        var row =
                jdbc
                        .sql(
                                "select"
                                    + " d.id,d.moderation_status,j.customer_id,j.cake_request_id,j.status"
                                    + " from generated_designs d join generation_jobs j on"
                                    + " j.id=d.generation_job_id where d.id=:id")
                        .param("id", designId)
                        .query()
                        .listOfRows()
                        .stream()
                        .findFirst()
                        .orElseThrow(BusinessException::missing);
        return Map.of(
                "id",
                designId,
                "exists",
                true,
                "ownerMatches",
                customerId.equals(row.get("customer_id")),
                "requestMatches",
                cakeRequestId.equals(row.get("cake_request_id")),
                "moderationStatus",
                row.get("moderation_status"),
                "jobStatus",
                row.get("status"));
    }

    public Map<String, Boolean> context(UUID requestId) {
        boolean exists =
                jdbc.sql("select exists(select 1 from generation_jobs where cake_request_id=:id)")
                        .param("id", requestId)
                        .query(Boolean.class)
                        .single();
        return Map.of("hasJobs", exists);
    }
}
