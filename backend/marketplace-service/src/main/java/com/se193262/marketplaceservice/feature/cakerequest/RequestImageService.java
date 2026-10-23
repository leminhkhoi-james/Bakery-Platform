package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.RequestImageResponse;

import org.springframework.web.multipart.MultipartFile;

import java.util.*;

public interface RequestImageService {
    List<RequestImageResponse> upload(
            UUID requestId, List<MultipartFile> files, List<Integer> displayOrder);

    void delete(UUID requestId, UUID imageId);

    void cleanOrphans();
}
