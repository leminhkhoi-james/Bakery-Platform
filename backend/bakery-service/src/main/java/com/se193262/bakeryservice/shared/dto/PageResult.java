package com.se193262.bakeryservice.shared.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record PageResult<T>(Meta meta, List<T> result) {

    public record Meta(int page, int pageSize, int pages, long total) {
    }

    public static <T> PageResult<T> fromPage(Page<T> page) {
        return new PageResult<>(
                new Meta(page.getNumber() + 1, page.getSize(), page.getTotalPages(), page.getTotalElements()),
                page.getContent()
        );
    }
}
