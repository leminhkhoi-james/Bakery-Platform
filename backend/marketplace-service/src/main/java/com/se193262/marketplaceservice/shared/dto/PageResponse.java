package com.se193262.marketplaceservice.shared.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record PageResponse<T>(List<T> result, Meta meta) {
    public record Meta(int page, int pageSize, int pages, long total) {}

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                new Meta(
                        page.getNumber() + 1,
                        page.getSize(),
                        page.getTotalPages(),
                        page.getTotalElements()));
    }
}
