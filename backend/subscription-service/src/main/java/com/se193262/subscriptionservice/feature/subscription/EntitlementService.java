package com.se193262.subscriptionservice.feature.subscription;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class EntitlementService {
    private final JdbcClient jdbc;

    public EntitlementService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> entitlement(UUID bakeryId) {
        var rows =
                jdbc.sql(
                                "select p.code,s.period_end,p.id as plan_id from"
                                    + " bakery_subscriptions s join subscription_plans p on"
                                    + " p.id=s.plan_id where s.bakery_id=:id and s.status='ACTIVE'"
                                    + " and s.period_start<=now() and s.period_end>now() and"
                                    + " p.status='ACTIVE'")
                        .param("id", bakeryId)
                        .query()
                        .listOfRows();
        if (rows.isEmpty())
            return Map.of("bakeryId", bakeryId, "active", false, "features", Map.of());
        var row = rows.getFirst();
        Map<String, String> features = new HashMap<>();
        jdbc.sql("select feature_code,feature_value from plan_features where plan_id=:id")
                .param("id", row.get("plan_id"))
                .query()
                .listOfRows()
                .forEach(
                        f ->
                                features.put(
                                        (String) f.get("feature_code"),
                                        (String) f.get("feature_value")));
        Object end = row.get("period_end");
        Instant expiry =
                end instanceof OffsetDateTime time
                        ? time.toInstant()
                        : ((java.sql.Timestamp) end).toInstant();
        return Map.of(
                "bakeryId",
                bakeryId,
                "active",
                true,
                "planCode",
                row.get("code"),
                "periodEnd",
                expiry,
                "features",
                features);
    }
}
