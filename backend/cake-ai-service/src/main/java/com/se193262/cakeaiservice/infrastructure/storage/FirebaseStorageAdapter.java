package com.se193262.cakeaiservice.infrastructure.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import com.google.cloud.http.HttpTransportOptions;
import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.platform.exception.BusinessException;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class FirebaseStorageAdapter implements ImageStorage {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FirebaseStorageAdapter.class);
    private final CakeAiProperties properties;
    private volatile Storage storage;
    private volatile boolean firebaseFailed = false;
    private String pageToken;
    private final Map<String, byte[]> localCache = new ConcurrentHashMap<>();
    private final Map<String, Instant> localTimestamps = new ConcurrentHashMap<>();

    public FirebaseStorageAdapter(CakeAiProperties properties) {
        this.properties = properties;
    }

    private synchronized Storage storage() {
        if (storage != null) return storage;
        if (firebaseFailed) return null;
        try {
            if (properties.firebaseBucket().isBlank() || properties.firebaseProjectId().isBlank()) {
                firebaseFailed = true;
                log.info("Firebase storage credentials not configured. Using local storage adapter.");
                return null;
            }
            storage = StorageOptions.newBuilder().setProjectId(properties.firebaseProjectId())
                    .setCredentials(GoogleCredentials.getApplicationDefault())
                    .setTransportOptions(HttpTransportOptions.newBuilder()
                            .setConnectTimeout(Math.toIntExact(properties.connectTimeout().toMillis()))
                            .setReadTimeout(Math.toIntExact(properties.readTimeout().toMillis())).build())
                    .build().getService();
            return storage;
        } catch (Exception error) {
            firebaseFailed = true;
            log.warn("Could not initialize Firebase Storage ({}). Falling back to local storage.", error.getMessage());
            return null;
        }
    }

    public void checkAvailable() {
        storage();
    }

    public void upload(String key, byte[] bytes, String mediaType) {
        localCache.put(key, bytes);
        localTimestamps.put(key, Instant.now());
        Storage s = storage();
        if (s != null) {
            try {
                s.create(BlobInfo.newBuilder(properties.firebaseBucket(), key)
                        .setContentType(mediaType).build(), bytes, Storage.BlobTargetOption.doesNotExist());
            } catch (StorageException error) {
                log.warn("Firebase upload failed, kept in local storage: key={}", key);
            }
        }
    }

    public byte[] read(String key) {
        byte[] cached = localCache.get(key);
        if (cached != null) return cached;
        Storage s = storage();
        if (s != null) {
            try {
                byte[] bytes = s.readAllBytes(properties.firebaseBucket(), key);
                if (bytes != null) {
                    localCache.put(key, bytes);
                    return bytes;
                }
            } catch (StorageException error) {
                throw BusinessException.unavailable();
            }
        }
        return cached;
    }

    public void delete(String key) {
        localCache.remove(key);
        localTimestamps.remove(key);
        Storage s = storage();
        if (s != null) {
            try {
                s.delete(properties.firebaseBucket(), key);
            } catch (StorageException error) {
                log.warn("Firebase delete failed: key={}", key);
            }
        }
    }

    public String signedUrl(String key) {
        Storage s = storage();
        if (s != null) {
            try {
                return s.signUrl(BlobInfo.newBuilder(properties.firebaseBucket(), key).build(),
                        15, TimeUnit.MINUTES, Storage.SignUrlOption.withV4Signature()).toString();
            } catch (Exception error) {
                throw BusinessException.unavailable();
            }
        }
        String base = properties.publicUrl().replaceAll("/+$", "");
        return base + "/storage/" + key;
    }

    public synchronized List<StoredObject> scan(int limit) {
        Storage s = storage();
        if (s != null) {
            try {
                List<Storage.BlobListOption> options = new ArrayList<>();
                options.add(Storage.BlobListOption.prefix("cake-ai/"));
                options.add(Storage.BlobListOption.pageSize(limit));
                if (pageToken != null) options.add(Storage.BlobListOption.pageToken(pageToken));
                var page = s.list(properties.firebaseBucket(), options.toArray(Storage.BlobListOption[]::new));
                pageToken = page.getNextPageToken();
                List<StoredObject> result = new ArrayList<>();
                for (Blob blob : page.getValues())
                    result.add(new StoredObject(blob.getName(), blob.getCreateTimeOffsetDateTime().toInstant()));
                return result;
            } catch (StorageException error) {
                log.warn("Firebase scan failed, falling back to local scan.");
            }
        }
        return localTimestamps.entrySet().stream()
                .limit(limit)
                .map(entry -> new StoredObject(entry.getKey(), entry.getValue()))
                .toList();
    }
}
