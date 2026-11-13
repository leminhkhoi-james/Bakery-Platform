package com.se193262.subscriptionservice.infrastructure.storage;

import com.se193262.subscriptionservice.exception.AppException;
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
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class PaymentProofStorage {
    private static final Logger log = LoggerFactory.getLogger(PaymentProofStorage.class);
    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private final String endpoint;
    private final String publicEndpoint;
    private final String accessKey;
    private final String secretKey;
    private final String bucket;
    private final String region;

    public PaymentProofStorage(@Value("${storage.minio.endpoint:}") String endpoint,
            @Value("${storage.minio.public-endpoint:}") String publicEndpoint,
            @Value("${storage.minio.access-key:}") String accessKey,
            @Value("${storage.minio.secret-key:}") String secretKey,
            @Value("${storage.minio.bucket:subscription-proofs}") String bucket,
            @Value("${storage.minio.region:us-east-1}") String region) {
        this.endpoint = endpoint;
        this.publicEndpoint = publicEndpoint;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.bucket = bucket;
        this.region = region;
    }

    public String upload(MultipartFile file, UUID orderId) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Proof must be between 1 byte and 10 MB");
        }
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length == 0 || bytes.length > MAX_BYTES) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Proof must be between 1 byte and 10 MB");
            }
            String type = detect(bytes);
            String declared = file.getContentType() == null ? "" : file.getContentType().split(";", 2)[0].trim();
            if (type == null || !type.equalsIgnoreCase(declared)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Unsupported proof or content type mismatch");
            }
            String key = "payments/" + orderId + "/" + UUID.randomUUID();
            MinioClient storage = client(endpoint);
            if (!storage.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                storage.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            storage.putObject(PutObjectArgs.builder().bucket(bucket).object(key)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1).contentType(type).build());
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCompletion(int status) {
                        if (status != STATUS_COMMITTED) deleteQuietly(key);
                    }
                });
            }
            return key;
        } catch (AppException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Proof could not be read");
        } catch (Exception exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Proof storage is unavailable");
        }
    }

    public String signedUrl(String key) {
        if (key == null) return null;
        try {
            // The browser URL can be unreachable from Docker; sign without a region lookup.
            return client(publicEndpoint.isBlank() ? endpoint : publicEndpoint)
                    .getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET).region(region).bucket(bucket).object(key)
                            .expiry(15, TimeUnit.MINUTES).build());
        } catch (Exception exception) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Proof storage is unavailable");
        }
    }

    private MinioClient client(String url) {
        if (url.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Proof storage is not configured");
        }
        return MinioClient.builder().endpoint(url).credentials(accessKey, secretKey).build();
    }

    public void deleteQuietly(String key) {
        try { client(endpoint).removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build()); }
        catch (Exception exception) { log.warn("Proof cleanup failed for object {}", key, exception); }
    }

    private static String detect(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216
                && (bytes[2] & 255) == 255) return "image/jpeg";
        if (bytes.length >= 8 && (bytes[0] & 255) == 137 && bytes[1] == 'P'
                && bytes[2] == 'N' && bytes[3] == 'G' && bytes[4] == 13
                && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) return "image/png";
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F'
                && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E'
                && bytes[10] == 'B' && bytes[11] == 'P') return "image/webp";
        if (bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P'
                && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-') return "application/pdf";
        return null;
    }
}
