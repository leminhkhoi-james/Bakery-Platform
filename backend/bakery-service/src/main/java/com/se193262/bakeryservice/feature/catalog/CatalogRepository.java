package com.se193262.bakeryservice.feature.catalog;

import com.se193262.platform.exception.BusinessException;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class CatalogRepository {
    private final JdbcClient jdbc;

    public CatalogRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> one(String sql, Map<String, ?> parameters) {
        return jdbc.sql(sql).params(parameters).query().listOfRows().stream()
                .findFirst()
                .orElseThrow(BusinessException::missing);
    }

    public List<Map<String, Object>> list(String sql, Map<String, ?> parameters) {
        return jdbc.sql(sql).params(parameters).query().listOfRows();
    }
}
