package com.se193262.cakeaiservice.feature.design;

import com.se193262.platform.exception.BusinessException;
import com.se193262.cakeaiservice.infrastructure.storage.ImageStorage;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class DesignValidationService {
    private final JdbcClient jdbc;

    private final ImageStorage storage;

    public DesignValidationService(JdbcClient jdbc, ImageStorage storage) {
        this.jdbc = jdbc;
        this.storage = storage;
    }

    public Map<String, Object> validate(UUID designId, UUID customerId, UUID cakeRequestId, boolean includeImage) {
        var row =
                jdbc
                        .sql(
                                "select"
                                    + " d.id,d.image_object_key,d.moderation_status,j.customer_id,j.cake_request_id,j.status"
                                    + " from generated_designs d join generation_jobs j on"
                                    + " j.id=d.generation_job_id where d.id=:id")
                        .param("id", designId)
                        .query()
                        .listOfRows()
                        .stream()
                        .findFirst()
                        .orElseThrow(BusinessException::missing);
        var result = new HashMap<String, Object>(Map.of(
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
                row.get("status")));
        if (includeImage && Boolean.TRUE.equals(result.get("ownerMatches"))
                && Boolean.TRUE.equals(result.get("requestMatches"))
                && "APPROVED".equals(result.get("moderationStatus"))
                && "SUCCEEDED".equals(result.get("jobStatus"))) {
            result.put("imageUrl", storage.signedUrl((String) row.get("image_object_key")));
        }
        return result;
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
