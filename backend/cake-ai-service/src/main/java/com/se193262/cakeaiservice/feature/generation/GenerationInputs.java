package com.se193262.cakeaiservice.feature.generation;

import com.se193262.cakeaiservice.config.CakeAiProperties;
import com.se193262.cakeaiservice.feature.generation.GenerationData.Source;
import com.se193262.cakeaiservice.infrastructure.client.*;
import com.se193262.cakeaiservice.infrastructure.storage.*;
import com.se193262.cakeaiservice.infrastructure.storage.ImageValidator.Image;
import com.se193262.platform.exception.BusinessException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Component
public class GenerationInputs {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GenerationInputs.class);
    private final MarketplaceClient marketplace;
    private final ImageProvider provider;
    private final ImageStorage storage;
    private final ImageValidator validator;
    private final CakeAiProperties properties;

    public GenerationInputs(MarketplaceClient marketplace, ImageProvider provider, ImageStorage storage,
            ImageValidator validator, CakeAiProperties properties) {
        this.marketplace = marketplace; this.provider = provider; this.storage = storage;
        this.validator = validator; this.properties = properties;
    }

    public String model() { return properties.imageModel(); }

    public void validateContext(UUID requestId, UUID customerId) {
        marketplace.validate(requestId, customerId);
        provider.checkAvailable();
        storage.checkAvailable();
    }

    public List<Image> validateFiles(List<MultipartFile> files) {
        if (files == null) return List.of();
        if (files.size() > 5) throw BusinessException.invalid("At most five source images are allowed");
        List<Image> result = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.getSize() > 10 * 1024 * 1024) throw BusinessException.invalid("Image exceeds 10 MB");
            try { result.add(validator.validate(file.getBytes())); }
            catch (java.io.IOException error) { throw BusinessException.invalid("Cannot read source image"); }
        }
        return result;
    }

    public List<Source> upload(UUID jobId, List<Image> images) {
        List<Source> sources = new ArrayList<>();
        try {
            for (int index = 0; index < images.size(); index++) {
                Image image = images.get(index);
                UUID id = UUID.randomUUID();
                String key = "cake-ai/sources/" + jobId + "/" + id;
                sources.add(new Source(id, jobId, key, image.mediaType(), image.bytes().length, index));
                storage.upload(key, image.bytes(), image.mediaType());
            }
            return sources;
        } catch (RuntimeException error) {
            cleanup(sources.stream().map(Source::objectKey).toList());
            throw error;
        }
    }

    public void cleanup(List<String> keys) {
        for (String key : keys) {
            try { storage.delete(key); }
            catch (RuntimeException error) { log.warn("AI object cleanup deferred: key={}", key); }
        }
    }
}
