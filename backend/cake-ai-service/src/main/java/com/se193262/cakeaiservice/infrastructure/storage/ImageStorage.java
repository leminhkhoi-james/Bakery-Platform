package com.se193262.cakeaiservice.infrastructure.storage;

import java.time.Instant;
import java.util.List;

public interface ImageStorage {
    record StoredObject(String key, Instant createdAt) {}
    void checkAvailable();
    void upload(String key, byte[] bytes, String mediaType);
    byte[] read(String key);
    void delete(String key);
    String signedUrl(String key);
    List<StoredObject> scan(int limit);
}
