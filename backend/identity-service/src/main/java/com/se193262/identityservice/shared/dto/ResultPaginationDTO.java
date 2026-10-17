package com.se193262.identityservice.shared.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record ResultPaginationDTO(
        Meta meta,
        List<?> result) {

    public record Meta(
            int page,
            int pageSize,
            int pages,
            long total) {
}

    public static ResultPaginationDTO fromPage(Page<?> page) {
        Meta meta = new Meta(
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalPages(),
                page.getTotalElements());
        return new ResultPaginationDTO(meta, page.getContent());
    }
}
