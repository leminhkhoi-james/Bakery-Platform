package com.se193262.marketplaceservice.shared;

import com.se193262.platform.exception.BusinessException;

import org.springframework.data.domain.*;

import java.util.*;

public final class QueryPaging {
    private QueryPaging() {}

    public static Pageable page(Map<String, String> filters, Set<String> allowed) {
        try {
            int page = Integer.parseInt(filters.getOrDefault("page", "1")),
                    size = Integer.parseInt(filters.getOrDefault("size", "20"));
            String[] sort = filters.getOrDefault("sort", "createdAt,desc").split(",");
            if (page < 1
                    || size < 1
                    || size > 100
                    || sort.length != 2
                    || !allowed.contains(sort[0])
                    || !Set.of("asc", "desc").contains(sort[1]))
                throw new IllegalArgumentException();
            return PageRequest.of(
                    page - 1,
                    size,
                    Sort.by(Sort.Direction.fromString(sort[1]), sort[0]).and(Sort.by("id")));
        } catch (IllegalArgumentException error) {
            throw new BusinessException(400, "Invalid pagination or sort");
        }
    }
}
