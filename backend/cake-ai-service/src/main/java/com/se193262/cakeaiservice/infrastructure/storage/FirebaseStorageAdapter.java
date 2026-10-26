package com.se193262.cakeaiservice.infrastructure.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import com.google.cloud.http.HttpTransportOptions;
import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.platform.exception.BusinessException;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
public class FirebaseStorageAdapter implements ImageStorage {
    private final CakeAiProperties properties;
    private volatile Storage storage;
    private String pageToken;

    public FirebaseStorageAdapter(CakeAiProperties properties) { this.properties = properties; }

    private synchronized Storage storage() {
        if (storage != null) return storage;
        try {
            if (properties.firebaseBucket().isBlank() || properties.firebaseProjectId().isBlank())
                throw BusinessException.unavailable();
            storage = StorageOptions.newBuilder().setProjectId(properties.firebaseProjectId())
                    .setCredentials(GoogleCredentials.getApplicationDefault())
                    .setTransportOptions(HttpTransportOptions.newBuilder()
                            .setConnectTimeout(Math.toIntExact(properties.connectTimeout().toMillis()))
                            .setReadTimeout(Math.toIntExact(properties.readTimeout().toMillis())).build())
                    .build().getService();
            return storage;
        } catch (Exception error) { throw BusinessException.unavailable(); }
    }

    public void checkAvailable() { storage(); }

    public void upload(String key, byte[] bytes, String mediaType) {
        try {
            storage().create(BlobInfo.newBuilder(properties.firebaseBucket(), key)
                    .setContentType(mediaType).build(), bytes, Storage.BlobTargetOption.doesNotExist());
        } catch (StorageException error) { throw BusinessException.unavailable(); }
    }

    public byte[] read(String key) {
        try { return storage().readAllBytes(properties.firebaseBucket(), key); }
        catch (StorageException error) { throw BusinessException.unavailable(); }
    }

    public void delete(String key) {
        try { storage().delete(properties.firebaseBucket(), key); }
        catch (StorageException error) { throw BusinessException.unavailable(); }
    }

    public String signedUrl(String key) {
        try {
            return storage().signUrl(BlobInfo.newBuilder(properties.firebaseBucket(), key).build(),
                    15, TimeUnit.MINUTES, Storage.SignUrlOption.withV4Signature()).toString();
        } catch (Exception error) { throw BusinessException.unavailable(); }
    }

    public synchronized List<StoredObject> scan(int limit) {
        try {
            List<Storage.BlobListOption> options = new ArrayList<>();
            options.add(Storage.BlobListOption.prefix("cake-ai/"));
            options.add(Storage.BlobListOption.pageSize(limit));
            if (pageToken != null) options.add(Storage.BlobListOption.pageToken(pageToken));
            var page = storage().list(properties.firebaseBucket(), options.toArray(Storage.BlobListOption[]::new));
            pageToken = page.getNextPageToken();
            List<StoredObject> result = new ArrayList<>();
            for (Blob blob : page.getValues())
                result.add(new StoredObject(blob.getName(), blob.getCreateTimeOffsetDateTime().toInstant()));
            return result;
        } catch (StorageException error) { throw BusinessException.unavailable(); }
    }
}
