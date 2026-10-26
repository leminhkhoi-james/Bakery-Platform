package com.se193262.chatservice.infrastructure.storage;

import com.se193262.chatservice.config.StorageProperties;
import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Component
public class MinioAttachmentStorage implements AttachmentStorage {

    private final MinioClient client;
    private final String bucket;

    public MinioAttachmentStorage(StorageProperties properties) {
        this.bucket = properties.bucket();
        this.client = MinioClient.builder()
                .endpoint(properties.endpoint())
                .credentials(properties.accessKey(), properties.secretKey())
                .build();
    }

    @Override
    public void put(String objectKey, InputStream content, long size, String mediaType) {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(content, size, -1)
                    .contentType(mediaType)
                    .build());
        } catch (Exception exception) {
            throw new StorageUnavailableException("Attachment storage upload failed", exception);
        }
    }

    @Override
    public String signedGetUrl(String objectKey, java.time.Duration expiry) {
        try {
            return client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry(Math.toIntExact(expiry.toSeconds()), TimeUnit.SECONDS)
                    .build());
        } catch (Exception exception) {
            throw new StorageUnavailableException("Attachment URL signing failed", exception);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception exception) {
            throw new StorageUnavailableException("Attachment storage deletion failed", exception);
        }
    }
}
