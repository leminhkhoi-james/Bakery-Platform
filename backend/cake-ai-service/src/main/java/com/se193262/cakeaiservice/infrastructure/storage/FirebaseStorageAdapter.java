package com.se193262.cakeaiservice.infrastructure.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import com.google.cloud.http.HttpTransportOptions;
import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.platform.exception.BusinessException;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;

/** Private durable GCS storage. No RAM fallback or success after failed writes. */
@Component
public class FirebaseStorageAdapter implements ImageStorage {
    private final CakeAiProperties properties;
    private final String credentialsBase64;
    private volatile Storage storage;
    private String pageToken;

    public FirebaseStorageAdapter(CakeAiProperties properties) { this(properties, ""); }

    @Autowired
    public FirebaseStorageAdapter(CakeAiProperties properties,
            @Value("${cake-ai.firebase-credentials-base64:}") String credentialsBase64) {
        this.properties = properties;
        this.credentialsBase64 = credentialsBase64;
    }

    private synchronized Storage storage() {
        if (storage != null) return storage;
        if (properties.firebaseBucket().isBlank() || properties.firebaseProjectId().isBlank())
            throw new StorageFailureException();
        try {
            storage = StorageOptions.newBuilder().setProjectId(properties.firebaseProjectId())
                    .setCredentials(credentialsBase64.isBlank()
                            ? GoogleCredentials.getApplicationDefault()
                            : GoogleCredentials.fromStream(new java.io.ByteArrayInputStream(
                                    Base64.getDecoder().decode(credentialsBase64))))
                    .setTransportOptions(HttpTransportOptions.newBuilder()
                            .setConnectTimeout(Math.toIntExact(properties.connectTimeout().toMillis()))
                            .setReadTimeout(Math.toIntExact(properties.readTimeout().toMillis())).build())
                    .build().getService();
            return storage;
        } catch (Exception error) { throw new StorageFailureException(); }
    }

    public void checkAvailable() { storage(); }

    public void upload(String key, byte[] bytes, String mediaType) {
        var image = new ImageValidator().validate(bytes);
        if (!image.mediaType().equals(mediaType)) throw BusinessException.invalid("Image MIME does not match content");
        Storage client = storage();
        try {
            client.create(BlobInfo.newBuilder(properties.firebaseBucket(), key).setContentType(mediaType)
                    .setCacheControl("private, no-store, max-age=0")
                    .setMetadata(Map.of("sha256", checksum(bytes))).build(), bytes,
                    Storage.BlobTargetOption.doesNotExist());
            // Verify cloud persistence before allowing the worker to publish metadata.
            byte[] persisted = client.readAllBytes(properties.firebaseBucket(), key);
            if (!Arrays.equals(bytes, persisted)) throw new StorageFailureException();
        } catch (StorageException error) { throw new StorageFailureException(); }
    }

    public byte[] read(String key) {
        try {
            byte[] bytes = storage().readAllBytes(properties.firebaseBucket(), key);
            if (bytes == null) throw BusinessException.missing();
            return bytes;
        } catch (StorageException error) {
            if (error.getCode() == 404) throw BusinessException.missing();
            throw new StorageFailureException();
        }
    }

    public void delete(String key) {
        try { storage().delete(properties.firebaseBucket(), key); }
        catch (StorageException error) { throw new StorageFailureException(); }
    }

    public String signedUrl(String key) {
        try {
            return storage().signUrl(BlobInfo.newBuilder(properties.firebaseBucket(), key).build(),
                    15, TimeUnit.MINUTES, Storage.SignUrlOption.withV4Signature()).toString();
        } catch (Exception error) { throw new StorageFailureException(); }
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
        } catch (StorageException error) { throw new StorageFailureException(); }
    }

    private static String checksum(byte[] bytes) {
        try { return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
}
