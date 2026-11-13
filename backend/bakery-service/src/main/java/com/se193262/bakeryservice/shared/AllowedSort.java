package com.se193262.bakeryservice.shared;

import com.se193262.bakeryservice.exception.AppException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

import java.util.Set;

public final class AllowedSort {
    private AllowedSort() {}

    public static Sort parse(String value, Set<String> fields) {
        String[] parts = value == null ? new String[0] : value.split(",", -1);
        if (parts.length != 2 || !fields.contains(parts[0])
                || !(parts[1].equals("asc") || parts[1].equals("desc"))) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid sort field or direction");
        }
        Sort sort = Sort.by(parts[1].equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, parts[0]);
        return parts[0].equals("id") ? sort : sort.and(Sort.by("id"));
    }
}
