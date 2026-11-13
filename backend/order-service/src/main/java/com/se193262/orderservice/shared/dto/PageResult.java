package com.se193262.orderservice.shared.dto;

import java.util.List;

public record PageResult<T>(Meta meta, List<T> result) {

    public record Meta(int page, int pageSize, int pages, long total) {
    }
}
