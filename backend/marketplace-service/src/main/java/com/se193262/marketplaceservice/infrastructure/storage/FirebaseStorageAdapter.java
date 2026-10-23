package com.se193262.marketplaceservice.infrastructure.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import com.google.firebase.*;
import com.se193262.marketplaceservice.config.FirebaseProperties;
import com.se193262.platform.exception.BusinessException;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
@EnableConfigurationProperties(FirebaseProperties.class)
public class FirebaseStorageAdapter implements ImageStorage {
    private final FirebaseProperties properties;
    private volatile Storage storage;
    private String pageToken;

    public FirebaseStorageAdapter(FirebaseProperties properties) {
        this.properties = properties;
    }

    private synchronized Storage storage() {
        if (storage != null) return storage;
        try {
            if (properties.bucket() == null
                    || properties.bucket().isBlank()
                    || properties.projectId() == null
                    || properties.projectId().isBlank()) throw BusinessException.unavailable();
            var credentials = GoogleCredentials.getApplicationDefault();
            var options =
                    FirebaseOptions.builder()
                            .setCredentials(credentials)
                            .setProjectId(properties.projectId())
                            .setStorageBucket(properties.bucket())
                            .build();
            FirebaseApp.initializeApp(options, "marketplace-" + UUID.randomUUID());
            storage =
                    StorageOptions.newBuilder()
                            .setTransportOptions(
                                    com.google.cloud.http.HttpTransportOptions.newBuilder()
                                            .setConnectTimeout(
                                                    Math.toIntExact(
                                                            properties.connectTimeout().toMillis()))
                                            .setReadTimeout(
                                                    Math.toIntExact(
                                                            properties.readTimeout().toMillis()))
                                            .build())
                            .setCredentials(credentials)
                            .setProjectId(properties.projectId())
                            .build()
                            .getService();
            return storage;
        } catch (Exception error) {
            throw BusinessException.unavailable();
        }
    }

    public void upload(String key, byte[] bytes, String mediaType) {
        try {
            storage()
                    .create(
                            BlobInfo.newBuilder(properties.bucket(), key)
                                    .setContentType(mediaType)
                                    .build(),
                            bytes,
                            Storage.BlobTargetOption.doesNotExist());
        } catch (StorageException error) {
            throw BusinessException.unavailable();
        }
    }

    public void delete(String key) {
        try {
            storage().delete(properties.bucket(), key);
        } catch (StorageException error) {
            throw BusinessException.unavailable();
        }
    }

    public String signedUrl(String key) {
        try {
            return storage()
                    .signUrl(
                            BlobInfo.newBuilder(properties.bucket(), key).build(),
                            15,
                            TimeUnit.MINUTES,
                            Storage.SignUrlOption.withV4Signature())
                    .toString();
        } catch (Exception error) {
            throw BusinessException.unavailable();
        }
    }

    public synchronized List<StoredObject> scan(int limit) {
        try {
            var options = new ArrayList<Storage.BlobListOption>();
            options.add(Storage.BlobListOption.prefix("marketplace/requests/"));
            options.add(Storage.BlobListOption.pageSize(limit));
            if (pageToken != null) options.add(Storage.BlobListOption.pageToken(pageToken));
            var page =
                    storage()
                            .list(
                                    properties.bucket(),
                                    options.toArray(Storage.BlobListOption[]::new));
            pageToken = page.getNextPageToken();
            List<StoredObject> result = new ArrayList<>();
            for (Blob blob : page.getValues())
                result.add(
                        new StoredObject(
                                blob.getName(), blob.getCreateTimeOffsetDateTime().toInstant()));
            return result;
        } catch (StorageException error) {
            throw BusinessException.unavailable();
        }
    }
}
