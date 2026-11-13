package com.se193262.chatservice.infrastructure.storage;

import java.io.InputStream;
import java.time.Duration;

public interface AttachmentStorage {

    void put(String objectKey, InputStream content, long size, String mediaType);

    String signedGetUrl(String objectKey, Duration expiry);

    void delete(String objectKey);
}
