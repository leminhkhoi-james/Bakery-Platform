package com.se193262.bakeryservice.infrastructure.storage;

import com.se193262.bakeryservice.exception.AppException;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class BakeryImageStorage {
    private static final Logger log = LoggerFactory.getLogger(BakeryImageStorage.class);
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Duration URL_EXPIRY = Duration.ofMinutes(10);
    private final String endpoint;
    private final String publicEndpoint;
    private final String accessKey;
    private final String secretKey;
    private final String bucket;

    public BakeryImageStorage(@Value("${storage.minio.endpoint:}") String endpoint,
            @Value("${storage.minio.public-endpoint:}") String publicEndpoint,
            @Value("${storage.minio.access-key:}") String accessKey,
            @Value("${storage.minio.secret-key:}") String secretKey,
            @Value("${storage.minio.bucket:bakery-media}") String bucket) {
        this.endpoint = endpoint;
        this.publicEndpoint = publicEndpoint;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.bucket = bucket;
    }

    public StoredImage upload(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Image must be between 1 byte and 5 MB");
        }
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length == 0 || bytes.length > MAX_BYTES) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Image must be between 1 byte and 5 MB");
            }
            String mediaType = detect(bytes);
            String declared = file.getContentType() == null ? ""
                    : file.getContentType().split(";", 2)[0].trim();
            if (mediaType == null || !mediaType.equalsIgnoreCase(declared)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Unsupported image or content type mismatch");
            }
            String key = prefix + "/" + UUID.randomUUID();
            MinioClient client = client();
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            client.putObject(PutObjectArgs.builder().bucket(bucket).object(key)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                    .contentType(mediaType).build());
            onRollbackDelete(key);
            return new StoredImage(key, mediaType);
        } catch (AppException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Image could not be read");
        } catch (Exception exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Image storage is unavailable");
        }
    }

    public String signedUrl(String key) {
        try {
            return signingClient().getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET).bucket(bucket).object(key)
                    .expiry(Math.toIntExact(URL_EXPIRY.toSeconds()), TimeUnit.SECONDS).build());
        } catch (Exception exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Image storage is unavailable");
        }
    }

    public Duration urlExpiry() { return URL_EXPIRY; }

    public void afterCommitDelete(String key) {
        if (key == null) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { deleteQuietly(key); }
            });
        } else {
            deleteQuietly(key);
        }
    }

    private void onRollbackDelete(String key) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) deleteQuietly(key);
                }
            });
        }
    }

    private void deleteQuietly(String key) {
        try { client().removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build()); }
        catch (Exception exception) { log.warn("Image object cleanup failed for key {}", key, exception); }
    }

    private MinioClient client() {
        if (endpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Image storage is not configured");
        }
        return MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey).build();
    }

    private MinioClient signingClient() {
        if (publicEndpoint.isBlank()) return client();
        return MinioClient.builder().endpoint(publicEndpoint)
                .credentials(accessKey, secretKey).build();
    }

    private String detect(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8
                && (bytes[2] & 0xff) == 0xff) return "image/jpeg";
        if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 'P'
                && bytes[2] == 'N' && bytes[3] == 'G' && bytes[4] == 13
                && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) return "image/png";
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F'
                && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E'
                && bytes[10] == 'B' && bytes[11] == 'P') return "image/webp";
        return null;
    }

    public record StoredImage(String objectKey, String mediaType) { }
}
