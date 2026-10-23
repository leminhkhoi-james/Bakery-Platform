package com.se193262.marketplaceservice.infrastructure.storage;

import java.time.Instant;
import java.util.List;

public interface ImageStorage {
    record StoredObject(String key, Instant createdAt) {}

    void upload(String key, byte[] bytes, String mediaType);

    void delete(String key);

    String signedUrl(String key);

    List<StoredObject> scan(int limit);
}
