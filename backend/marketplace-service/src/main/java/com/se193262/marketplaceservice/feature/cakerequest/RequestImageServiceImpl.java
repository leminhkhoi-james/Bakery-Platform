package com.se193262.marketplaceservice.feature.cakerequest;

import com.se193262.marketplaceservice.feature.cakerequest.dto.RequestImageResponse;
import com.se193262.marketplaceservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.exception.BusinessException;
import com.se193262.platform.security.Actor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.*;
import java.util.*;

@Service
public class RequestImageServiceImpl implements RequestImageService {
    private final RequestImageRepository images;
    private final CakeRequestReader reader;
    private final MarketplaceAccess access;
    private final ImageStorage storage;
    private final TransactionTemplate transaction;
    private final Clock clock;
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(RequestImageServiceImpl.class);

    public RequestImageServiceImpl(
            RequestImageRepository images,
            CakeRequestReader reader,
            MarketplaceAccess access,
            ImageStorage storage,
            PlatformTransactionManager manager,
            Clock clock) {
        this.images = images;
        this.reader = reader;
        this.access = access;
        this.storage = storage;
        this.transaction = new TransactionTemplate(manager);
        this.clock = clock;
    }

    public List<RequestImageResponse> upload(
            UUID requestId, List<MultipartFile> files, List<Integer> displayOrder) {
        if (files == null
                || files.isEmpty()
                || files.size() > 10
                || displayOrder != null && displayOrder.size() != files.size())
            throw new BusinessException(400, "Invalid file count or order");
        Actor actor = Actor.current();
        transaction.executeWithoutResult(status -> access.draft(reader.request(requestId), actor));
        List<RequestImage> pending = new ArrayList<>();
        try {
            for (int index = 0; index < files.size(); index++) {
                var file = files.get(index);
                if (file.getSize() == 0 || file.getSize() > 10L * 1024 * 1024)
                    throw new BusinessException(400, "Invalid file size");
                byte[] bytes;
                try {
                    bytes = file.getBytes();
                } catch (java.io.IOException error) {
                    throw new BusinessException(400, "Cannot read file");
                }
                String type = mediaType(bytes),
                        extension =
                                type.equals("image/jpeg")
                                        ? "jpg"
                                        : type.equals("image/png") ? "png" : "webp";
                var image = RequestImage.create();
                image.setId(UUID.randomUUID());
                image.setCakeRequestId(requestId);
                image.setObjectKey(
                        "marketplace/requests/"
                                + requestId
                                + "/"
                                + image.getId()
                                + "."
                                + extension);
                image.setMediaType(type);
                image.setSizeBytes((long) bytes.length);
                image.setDisplayOrder(displayOrder == null ? index : displayOrder.get(index));
                image.setCreatedAt(clock.instant());
                if (image.getDisplayOrder() < 0)
                    throw new BusinessException(400, "Invalid display order");
                pending.add(image);
                storage.upload(image.getObjectKey(), bytes, type);
            }
            transaction.executeWithoutResult(
                    status -> {
                        var request = reader.request(requestId);
                        access.draft(request, actor);
                        access.touch(request, clock.instant());
                        images.saveAllAndFlush(pending);
                    });
        } catch (RuntimeException error) {
            pending.forEach(image -> safeDelete(image.getObjectKey()));
            throw error;
        }
        return pending.stream().map(reader::image).toList();
    }

    public void delete(UUID requestId, UUID imageId) {
        Actor actor = Actor.current();
        String key =
                transaction.execute(
                        status -> {
                            var request = reader.request(requestId);
                            access.draft(request, actor);
                            var image =
                                    images.findById(imageId)
                                            .filter(i -> i.getCakeRequestId().equals(requestId))
                                            .orElseThrow(BusinessException::missing);
                            access.touch(request, clock.instant());
                            images.delete(image);
                            return image.getObjectKey();
                        });
        safeDelete(key);
    }

    private void safeDelete(String key) {
        try {
            storage.delete(key);
        } catch (RuntimeException error) {
            log.warn("Image cleanup deferred");
        }
    }

    static String mediaType(byte[] bytes) {
        if (bytes.length >= 8
                && bytes[0] == (byte) 137
                && bytes[1] == 80
                && bytes[2] == 78
                && bytes[3] == 71
                && bytes[4] == 13
                && bytes[5] == 10
                && bytes[6] == 26
                && bytes[7] == 10) return "image/png";
        if (bytes.length >= 3
                && bytes[0] == (byte) 255
                && bytes[1] == (byte) 216
                && bytes[2] == (byte) 255) return "image/jpeg";
        if (bytes.length >= 12
                && new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)
                        .equals("RIFF")
                && new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII)
                        .equals("WEBP")) return "image/webp";
        throw new BusinessException(400, "Unsupported image content");
    }

    public void cleanOrphans() {
        for (var object : storage.scan(100))
            if (object.createdAt().isBefore(clock.instant().minus(Duration.ofHours(24)))
                    && !images.existsByObjectKey(object.key())) safeDelete(object.key());
    }
}
